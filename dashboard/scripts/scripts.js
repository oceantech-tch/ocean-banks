import { app } from "../../auth/Firebase/firebaseConfig.js";
import {
    getAuth,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore,
    getDoc,
    getDocs,
    updateDoc,
    collection,
    setDoc,
    doc,
    query,
    orderBy,
    limit,
    onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const auth = getAuth(app);
const DB = getFirestore(app);

const getElement = (selector) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Missing element: ${selector}`);
    return el;
};

const userNameElement = getElement(".user-name");
const userEmailElement = getElement(".user-email");
const accountBalance = getElement(".account-balance");
const accountNumberEl = getElement(".account-number");
const hideBal = getElement(".hide-bal");
const transferBtn = getElement(".dashboard-transfer-btn");
const toast = getElement("#toast");
const acctTypeWrap = getElement(".acct-type-wrap");
const accountTypeHeading = acctTypeWrap.querySelector("h3");
const dropdownMenu = acctTypeWrap.querySelector(".account-dropdown");
const recentHistoryWrap = getElement(".recent-history");
const returnButton = getElement(".return-btn");
const headingButtons = document.querySelectorAll("#heading > span button");

let isMasked = true;
let currentAccountType = "regular";

const showToast = (msg) => {
    toast.querySelector(".toast-message").textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 5000);
};

getElement(".toast-close").addEventListener("click", () => {
    toast.classList.remove("show");
});

// Balance Display
const updateBalanceDisplay = (balance) => {
    const formatted = balance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    if (isMasked) {
        accountBalance.textContent = "$ *****";
        hideBal.textContent = "visibility_off";
    } else {
        accountBalance.textContent = `$ ${formatted}`;

        hideBal.textContent = "visibility";
    }
};

hideBal.addEventListener("click", () => {
    isMasked = !isMasked;
    const real = parseFloat(accountBalance.dataset.real) || 0;
    updateBalanceDisplay(real);
    //   console.log(accountBalance.dataset)
});

// Dropdown Toggle for selecting account type
acctTypeWrap.querySelector(".caret").addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("slide");
});

// Handle Dropdown Selection
dropdownMenu.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", async () => {
        const selectedType = li.dataset.value;
        if (selectedType === currentAccountType) {
            dropdownMenu.classList.remove("slide");
            return;
        }
        currentAccountType = selectedType;
        accountTypeHeading.textContent =
            selectedType.charAt(0).toUpperCase() + selectedType.slice(1);
        dropdownMenu.classList.remove("slide");

        const user = auth.currentUser;
        if (user) {
            await loadAccountData(user.uid, currentAccountType);
            await loadTransactionHistory(user.uid, currentAccountType);
        }
    });
});

// Hide dropdown on outside click
document.addEventListener("click", (e) => {
    if (!acctTypeWrap.contains(e.target)) {
        dropdownMenu.classList.remove("slide");
    }
});

// Transfer Section Toggle
const toggleTransferPage = () => {
    const mainBody = getElement(".main-body");
    const transferBody = getElement("#transfer-body");

    transferBtn.addEventListener("click", (e) => {
        e.preventDefault();
        mainBody.style.display = "none";
        setTimeout(() => {
            transferBody.classList.add("active");
        }, 400);
    });

    returnButton.addEventListener("click", (e) => {
        e.preventDefault();
        transferBody.classList.remove("active");
        setTimeout(() => {
            mainBody.style.display = "block";
        }, 400);
    });
};

// On Transfer Page, handle headings
headingButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = btn.dataset.target;

        headingButtons.forEach((b) => b.classList.remove("active-tab"));
        btn.classList.add("active-tab");
    });
});

// Toggle between Transfer Pages
const toggleTransferPages = () => {
    const toMyAcctBtn = getElement("#to-my-acct-btn");
    const toOceanerBtn = getElement("#to-oceaner-btn");

    toMyAcctBtn.classList.add("active-tab");

    toMyAcctBtn.addEventListener("click", () => {
        toMyAcctBtn.classList.add("active-tab");
        toOceanerBtn.classList.remove("active-tab");
        if (toMyAcctBtn.classList.contains("active-tab")) {
            setTimeout(() => {
                getElement(".first-child").style.display = "block";
                getElement(".second-child").style.display = "none";
            }, 400);
        }
    });

    toOceanerBtn.addEventListener("click", () => {
        toMyAcctBtn.classList.remove("active-tab");
        toOceanerBtn.classList.add("active-tab");
        if (toOceanerBtn.classList.contains("active-tab")) {
            setTimeout(() => {
                getElement(".second-child").style.display = "block";
                getElement(".first-child").style.display = "none";
            }, 400);
        }
    });
};

// Oceaner Transfer   --   fetch and validate receiver
const receiverAccountInput = getElement("#receiver-account-number");
const receiverNameField = getElement("#receiver-name");
receiverAccountInput.addEventListener("blur", async () => {
    const accNum = receiverAccountInput.value.trim();
    const receiverNameEl = document.getElementById("receiver-name");
    // const spinnerEl = document.getElementById('receiver-lookup-spinner');

    if (!accNum || accNum.length < 10) {
        receiverNameEl.textContent = "";
        return;
    }

    receiverAccountInput.disabled = true;
    receiverNameEl.textContent = "";

    try {
        const indexRef = doc(DB, "accountsIndex", accNum);
        const indexSnap = await getDoc(indexRef);

        // BY DEFAULT, USER SENDS AND RECEIVES To & FROM REGULAR ACCOUNT

        if (indexSnap.exists()) {
            const { uid } = indexSnap.data();
            const userProfileRef = doc(DB, "users", uid, "userRegInfo", "profile");
            const userProfileSnap = await getDoc(userProfileRef);

            if (userProfileSnap.exists()) {
                const { firstName, lastName } = userProfileSnap.data();
                receiverNameEl.textContent = `Recipient: ${firstName} ${lastName}`;
                receiverNameEl.style.color = "green";
            } else {
                receiverNameEl.textContent = "User profile not found.";
                receiverNameEl.style.color = "orange";
            }
        } else {
            receiverNameEl.textContent = "Account number not found.";
            receiverNameEl.style.color = "red";
        }
    } catch (error) {
        console.error("Error fetching receiver info:", error);
        receiverNameEl.textContent = "Error checking account number. Try again.";
        receiverNameEl.style.color = "red";
    } finally {
        receiverAccountInput.disabled = false;
    }
});

const toggleSections = () => {
    const allButtons = document.querySelectorAll(".category-head span button");
    const activeCategory = getElement("#active-category");
    const categoryBodyDiv = document.querySelectorAll(".category div");

    if (allButtons.length > 0) {
        const first = allButtons[0];
        first.classList.add("active");
        activeCategory.textContent = first.innerText;
        categoryBodyDiv.forEach((section) => {
            section.style.display =
                section.dataset.target === first.dataset.target ? "flex" : "none";
        });
    }

    allButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            allButtons.forEach((b) => b.classList.remove("active"));
            e.target.classList.add("active");
            const target = e.target.dataset.target;
            activeCategory.textContent = e.target.innerText;
            categoryBodyDiv.forEach((div) => {
                div.style.display = div.dataset.target === target ? "flex" : "none";
            });
        });
    });
};

// Inward Transfer logic
const inwardTransferBtn = getElement("#inwardSubmit");
inwardTransferBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Login required");

    inwardTransferBtn.disabled = true;
    inwardTransferBtn.value = "Processing...";

    const from = getElement("#select-account").value;
    const to = getElement("#select-destination").value;
    const amount = parseFloat(getElement("#inward-transfer-amount").value);
    const narration = getElement(".narration-element textarea").value;

    if (!from || !to || from === to || isNaN(amount) || amount <= 0) {
        showToast("Fill all fields correctly");
        inwardTransferBtn.disabled = false;
        inwardTransferBtn.value = "Next";
        return;
    }

    try {
        const fromRef = doc(DB, "users", user.uid, "accounts", from);
        const toRef = doc(DB, "users", user.uid, "accounts", to);
        let fromSnap = await getDoc(fromRef);
        let toSnap = await getDoc(toRef);

        if (!fromSnap.exists()) {
            await setDoc(fromRef, { balance: 0 });
            fromSnap = await getDoc(fromRef);
        }
        if (!toSnap.exists()) {
            await setDoc(toRef, { balance: 0 });
            toSnap = await getDoc(toRef);
        }

        if (fromSnap.data().balance < amount) {
            showToast("Insufficient balance");
            return;
        }

        await Promise.all([
            updateDoc(fromRef, { balance: fromSnap.data().balance - amount }),
            updateDoc(toRef, { balance: toSnap.data().balance + amount }),
        ]);

        const txRef = doc(
            DB,
            "users",
            user.uid,
            "transactions",
            crypto.randomUUID()
        );
        await setDoc(txRef, {
            type: "inward-transfer",
            from,
            to,
            amount,
            narration,
            direction: "Debit",
            timestamp: new Date(),
        });

        showToast("Transfer successful");
        getElement("#select-account").value = "";
        getElement("#select-destination").value = "";
        getElement("#inward-transfer-amount").value = "";
        getElement(".narration-element textarea").value = "";

        await loadAccountData(user.uid, currentAccountType);
        await loadTransactionHistory(user.uid, currentAccountType);
    } catch (err) {
        console.error(err);
        showToast("Transfer failed");
    } finally {
        inwardTransferBtn.disabled = false;
        inwardTransferBtn.value = "Next";
    }
});

// ADDED: Oceaner Transfer summary & proceed logic
const oceanerTransferLogic = async () => {
    const user = auth.currentUser;
    if (!user) {
        showToast("Login required");
        return;
    }

    const amountEl = getElement("#oceaner-transfer-amount");
    const narrationEl = getElement("#oceaner-narration");
    const amount = parseFloat(amountEl.value);
    const narration = narrationEl.value.trim();
    const receiverAccNum = receiverAccountInput.value.trim().toUpperCase();

    if (!receiverAccNum || isNaN(amount) || amount <= 0 || !narration) {
        showToast("Please fill all fields correctly");
        return;
    }

    // Lookup receiver
    const indexSnap = await getDoc(doc(DB, "accountsIndex", receiverAccNum));
    if (!indexSnap.exists()) {
        showToast("Invalid account number");
        return;
    }
    const { uid: receiverUid, type: receiverAccType } = indexSnap.data();

    // Get sender full name
    const senderProf = await getDoc(
        doc(DB, "users", user.uid, "userRegInfo", "profile")
    );
    const { firstName = "", lastName = "" } = senderProf.exists()
        ? senderProf.data()
        : {};
    const senderFullName = `${firstName} ${lastName}`.trim();

    // Show summary page
    const summaryEl = getElement("#summary-page");
    summaryEl.classList.add("active");
    getElement(".inner .summary-page").innerHTML = `
        <span><strong>Sender:</strong> ${senderFullName}</span>
        <span><strong>Receiver (Acc #):</strong> ${receiverAccNum}</span>
        <span><strong>Amount:</strong> $${amount.toFixed(2)}</span>
        <span><strong>Narration:</strong> ${narration}</span>
        <hr>
        <button id="proceed-btn" type="button">Proceed</button>
    `;

    // Remove any previous event listeners by replacing the button
    const oldBtn = getElement("#proceed-btn");
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);

    newBtn.disabled = false;
    newBtn.onclick = async () => {
        newBtn.disabled = true;
        newBtn.textContent = "Processing...";
        try {
            // Use correct account types for sender and receiver
            const senderRef = doc(
                DB,
                "users",
                user.uid,
                "accounts",
                currentAccountType
            );
            const receiverRef = doc(
                DB,
                "users",
                receiverUid,
                "accounts",
                receiverAccType
            );
            // Fetch both account docs
            let [sendSnap, recvSnap] = await Promise.all([
                getDoc(senderRef),
                getDoc(receiverRef),
            ]);
            // If receiver account doesn't exist, initialize it
            if (!recvSnap.exists()) {
                await setDoc(receiverRef, { balance: 0 });
                recvSnap = await getDoc(receiverRef);
            }
            if (!sendSnap.exists() || sendSnap.data().balance < amount) {
                showToast("Insufficient funds");
                newBtn.disabled = false;
                newBtn.textContent = "Proceed";
                return;
            }
            const senderBalance = sendSnap.data().balance;
            const receiverBalance = recvSnap.data().balance || 0;

            // Perform transfer
            await Promise.all([
                updateDoc(senderRef, { balance: senderBalance - amount }),
                updateDoc(receiverRef, { balance: receiverBalance + amount }),
            ]);

            // Log transactions
            const txId = crypto.randomUUID();
            await Promise.all([
                setDoc(doc(DB, "users", user.uid, "transactions", txId), {
                    type: "Transfer to Oceaner",
                    direction: "Debit",
                    to: receiverAccNum,
                    amount,
                    narration,
                    timestamp: new Date(),
                }),
                setDoc(doc(DB, "users", receiverUid, "transactions", txId), {
                    type: "Received from Oceaner",
                    direction: "Credit",
                    from: senderFullName,
                    amount,
                    narration,
                    timestamp: new Date(),
                }),
            ]);

            showToast("Transfer Successful");
            amountEl.value = "";
            narrationEl.value = "";
            receiverAccountInput.value = "";
            receiverNameField.value = "";

            // Optionally hide summary
            summaryEl.classList.remove("active");

            await loadAccountData(user.uid, currentAccountType);
            await loadTransactionHistory(user.uid, currentAccountType);
        } catch (err) {
            console.error(err);
            showToast("Transfer failed");
        } finally {
            newBtn.disabled = false;
            newBtn.textContent = "Proceed";
        }
    };
};

// Receiver lookup on blur remains unchanged except small spinner logic if needed...

document.getElementById("oceanerSubmit").addEventListener("click", (e) => {
    e.preventDefault();
    oceanerTransferLogic();
});

// Load Balance on dashboard
const loadAccountData = async (uid, type = "regular") => {
    const ref = doc(DB, "users", uid, "accounts", type);
    return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
            const { balance = 0, accountNumber = "---" } = snap.data();
            accountNumberEl.textContent = accountNumber;
            accountBalance.dataset.real = balance;
            updateBalanceDisplay(balance);
        }
    });
};

// Load Transaction History
const loadTransactionHistory = async (uid, type = "regular") => {
    recentHistoryWrap.innerHTML = "";
    const txRef = collection(DB, "users", uid, "transactions");
    const q = query(txRef, orderBy("timestamp", "desc"), limit(5));
    const snap = await getDocs(q);

    if (snap.empty) {
        recentHistoryWrap.innerHTML = `
        <p><span class="material-symbols-outlined">info</span> You have no recent transfer history.</p>
        `;
        return;
    }

    snap.forEach((tx) => {
        const data = tx.data();
        const date = new Date(
            data.timestamp?.seconds * 1000 || Date.now()
        ).toLocaleString();

        // Regular to savings
        let isToSavings = data.from === "regular" && data.to === "savings";

        // Outward (sender)
        let isOutwardSender =
            data.type === "Transfer to Oceaner" && data.direction === "Debit";

        // Outward (receiver)
        let isOutwardReceiver =
            data.type === "Received from Oceaner" && data.direction === "Credit";

        let from;
        let to;

        if (isOutwardSender) {
            from = "Me";
            to = data.to;
        } else if (isOutwardReceiver) {
            from = data.from;
            to = "Me";
        } else if (isToSavings) {
            from = data.from;
            to = data.to;
        } else {
            from = "--";
            to = "--";
        }

        recentHistoryWrap.innerHTML += `
        <div class="tx-row">
          <strong>${data.type}</strong>
          <span>${from} → ${to}</span>
          <span>$${data.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}</span>
          <small>${data.narration}</small>
          <em>${date}</em>
        </div>`;
    });
};

const toggleTransactionHistory = async (uid, type = "regular") => {
    const txSection = getElement(".transaction-history");
    const txSectionBody = getElement("#transaction-history");
    const txReturnButton = getElement(".return-button");
    const txHistory = getElement(".tx-history");
    const accountInfo = getElement(".acc-no");

    // Remove any previous event listeners by replacing the button with a clone to avoid duplication
    const newTxSectionBtn = txSection.cloneNode(true);
    txSection.parentNode.replaceChild(newTxSectionBtn, txSection);
    const newReturnBtn = txReturnButton.cloneNode(true);
    txReturnButton.parentNode.replaceChild(newReturnBtn, txReturnButton);

    newTxSectionBtn.addEventListener("click", () => {
        txSectionBody.classList.add("active");
        getElement('.tx-menu').classList.add('active');
        getElement('.dash-board a').classList.remove('active');
    });

    newReturnBtn.addEventListener("click", () => {
        txSectionBody.classList.remove("active");
        getElement('.tx-menu').classList.remove('active');
        getElement('.dash-board a').classList.add('active');
    });

    // Fetch account details
    accountInfo.textContent = "";
    const accRef = collection(DB, "users", uid, "accounts");
    const accq = query(accRef, orderBy("accountNumber"));
    const accSnap = await getDocs(accq);

    if (accSnap.empty) {
        accountInfo.textContent = "No accounts found.";
    } else {
        accSnap.forEach((doc) => {
            const data = doc.data();
            if (data.type === "regular") {
                accountInfo.innerHTML += `<span>Oceaner Regular - ${data.accountNumber} | Balance: $${data.balance}</span>`;
            }
        });
    }

    txHistory.innerHTML = "";

    const txRef = collection(DB, "users", uid, "transactions");
    const q = query(txRef, orderBy("timestamp", "desc"), limit(5));
    const txSnap = await getDocs(q);

    if (txSnap.empty) {
        txHistory.innerHTML = `
            <p><span class="material-symbols-outlined">info</span> You have no recent transfer history.</p>
        `;
    }

    txSnap.forEach((tx) => {
        const data = tx.data();
        const date = new Date(
            data.timestamp?.seconds * 1000 || Date.now()
        ).toLocaleString();

        let isInward = data.type === "inward-transfer";

        // Regular to savings
        let isToSavings = data.from === "regular" && data.to === "savings";

        // Outward (sender)
        let isOutwardSender =
            data.type === "Transfer to Oceaner" && data.direction === "Debit";

        // Outward (receiver)
        let isOutwardReceiver =
            data.type === "Received from Oceaner" && data.direction === "Credit";

        let color;
        if (isToSavings) {
            color = "#1fc3b0";
        } else if (isOutwardSender) {
            color = "#f00";
        } else if (isOutwardReceiver) {
            color = "#1fc3b0";
        } else {
            color = "#333";
        }

        let from;
        let to;

        if (isOutwardSender) {
            from = "Me";
            to = data.to;
        } else if (isOutwardReceiver) {
            from = data.from;
            to = "Me";
        } else if (isToSavings) {
            from = data.from;
            to = data.to;
        } else {
            from = "--";
            to = "--";
        }

        let hyphen = data.direction === "Debit" ? "-" : "";
        let label = isInward ? "Inward" : "Outward - Oceaner";

        // Store calculated values in dataset for later use
        const txElement = document.createElement("div");
        txElement.className = "tx-row";
        txElement.dataset.tx = JSON.stringify({
            ...data,
            id: tx.id,
            date,
            color,
            from,
            to,
            hyphen,
            label,
        });
        // Display
        txElement.innerHTML = `
            <span class='date-el'>${date}</span>
            <strong>${label}</strong>
            <span class='dir-el'>${from} <span class='material-symbols-outlined'>swap_horiz</span> ${to}</span>
            <span class='amount-el' style='color:${color}'>${hyphen} $${data.amount.toLocaleString(
            undefined,
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}</span>
            <span class='narr-el'>${data.narration}</span>
        `;

        txHistory.appendChild(txElement);
    });

    if (txHistory.childNodes.length > 0) {
        const txRows = txHistory.querySelectorAll(".tx-row");

        txRows.forEach((row) => {
            row.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const confirmPDF = confirm("Generate PDF for this transaction?");
                if (!confirmPDF) return;

                // Get stored transaction data
                const txData = JSON.parse(row.dataset.tx);

                // Create PDF-friendly HTML
                const pdfContent = `
                    <style>
                        .pdf-container {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                            max-width: 460px;
                            border: 1px solid #eee;
                            border-radius: 8px;
                            background: #f9f9f9;
                        }
                        .pdf-header {
                            text-align: center;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                            margin-bottom: 15px;
                        }
                        .pdf-row {
                            display: flex;
                            margin-bottom: 8px;
                        }
                        .pdf-label {
                            font-weight: bold;
                            min-width: 120px;
                        }
                        .pdf-value {
                            flex-grow: 1;
                        }
                    </style>
                    <div class="pdf-container">
                        <div class="pdf-header">
                            <h2>Transaction Receipt</h2>
                            <p>Oceaner Banking</p>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-label">Date:</div>
                            <div class="pdf-value">${txData.date}</div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-label">Transaction Type: </div>
                            <div class="pdf-value">${txData.type}</div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-label">Direction: </div>
                            <div class="pdf-value">${txData.from} → ${txData.to
                    }</div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-label">Amount: </div>
                            <div class="pdf-value" style="color: ${txData.color
                    }">
                                ${txData.hyphen}$${txData.amount.toLocaleString(
                        undefined,
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                            </div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-label">Narration:</div>
                            <div class="pdf-value">${txData.narration}</div>
                        </div>
                        <div class="pdf-row">
                            <div class="pdf-label">Transaction ID:</div>
                            <div class="pdf-value">${txData.id}</div>
                        </div>
                    </div>
                `;

                //Avoids DOM cloning issues by using raw data so we create temporary container
                const element = document.createElement("div");
                element.innerHTML = pdfContent;
                document.body.appendChild(element);

                // PDF options
                const opt = {
                    margin: 0.5,
                    filename: `transaction-${txData.id}.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                    },
                    jsPDF: {
                        unit: "in",
                        format: "letter",
                        orientation: "portrait",
                    },
                };

                try {
                    // Generate and save PDF
                    await html2pdf().set(opt).from(element).save();

                } catch (error) {
                    console.error("PDF generation failed:", error);
                    alert("Failed to generate PDF. Please try again.");

                } finally {
                    // Clean up DOM
                    element.remove();
                }

            });
        });
    }
};

const logoutButton = getElement(".logout");
logoutButton.addEventListener("click", async (e) => {
    e.preventDefault();
    await auth.signOut();
});

// Initialization on page load
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("faded");
    getElement('.dash-board a').classList.add('active');
    toggleTransferPage();
    toggleSections();
    toggleTransferPages();

    onAuthStateChanged(auth, async (user) => {
        if (!user || !user.emailVerified) {
            await auth.signOut();
            window.location.href = "../index.html";
        }

        const getInitials = (name) =>
            name
                ?.trim()
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase();

        getElement(".username-initials").textContent = getInitials(
            user.displayName
        );
        getElement("#greetings-el").textContent = `Hello, ${user.displayName} 👋🏿`;
        userNameElement.textContent = user.displayName;
        userEmailElement.textContent = user.email;

        await loadAccountData(user.uid, currentAccountType);
        await loadTransactionHistory(user.uid, currentAccountType);
        await toggleTransactionHistory(user.uid, currentAccountType);
    });
});
