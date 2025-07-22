import { app } from "../Firebase/firebaseConfig.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, setDoc, doc, query, where, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const auth = getAuth(app);
const DB = getFirestore(app);

const getElement = (selector) => {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Element with selector ${selector} not found`);
    }
    return element;
}
const formEl = getElement('#form-el')
const firstname = getElement('#firstname')
const lastname = getElement('#lastname')
const phone = getElement('#phone')
const email = getElement('#email')
const confirmPassword = getElement('#confirm-password')
const password = getElement('#password')
const confPassText = getElement('#confPassText')


const generateAccountNumber = () => {
    return '585' + Math.floor(700000 + Math.random() * 6000000)
};

const getUniqueAccountNumber = async () => {
    let isUnique = false;
    let accountNumber = null;

    while (!isUnique) {
        accountNumber = generateAccountNumber();
        const q = query(collection(DB, 'users'), where('accountNumber', '==', accountNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            isUnique = true;
        }
    }
    return accountNumber;
}

const togglePasswordUpdate = () => {
    const hidePasswordIcons = document.querySelectorAll('.hide-password');
    hidePasswordIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            const input = icon.previousElementSibling;
            if (input && (input.type === 'password' || input.type === 'text')) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = 'visibility';
                } else {
                    input.type = 'password';
                    icon.textContent = 'visibility_off';
                }
            }
        });
    });
}
togglePasswordUpdate()


const showToast = (message) => {
    const toast = getElement('#toast');
    const messageSpan = toast.querySelector('.toast-message');
    messageSpan.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 5000);
} 
getElement('.toast-close').addEventListener('click', () => {
    getElement('#toast').classList.remove('show');
})


const validatePassword = () => {
    if (password.value.length < 8) {
        confPassText.textContent = 'Password must be at least 6 characters';
        return false;
    }
    if (password.value !== confirmPassword.value) {
        confPassText.textContent = 'Passwords do not match!';
        return false;
    }
    return true;
};

const signup = async () => {
    if (!validatePassword()) {
        throw new Error("Error validating password");
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user
        await updateProfile(user, {
            displayName: `${firstname.value} ${lastname.value}`,
        })
        return user;
    } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
            confPassText.textContent = 'This email is already registered. Please sign in.';
        } else if (err.code === 'auth/weak-password') {
            confPassText.textContent = 'Password should be at least 6 characters';
        } else if (err.code === 'auth/network-request-failed') {
            confPassText.textContent = 'Request failed please check your network and try again.';
        } else if (err.code === 'auth/password-does-not-meet-requirements') {
            confPassText.textContent = 'Password must contain a non-alphanumeric character and also include a special character.';
        }
        console.error(err)
        throw err;
    }
}

confirmPassword.addEventListener('input', () => {
    confPassText.textContent = (password.value !== confirmPassword.value) ? 'Passwords do not match' : '';
});

formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regularAccountNumber = await getUniqueAccountNumber();
    const savingsAccountNumber = await getUniqueAccountNumber();
    confPassText.textContent = '';
    getElement('#submit-btn').textContent = 'Processing please wait...';

    try {
        const user = await signup();

        // Save user registration info to userRegInfo/profile subCollection
        await setDoc(doc(DB, 'users', user.uid, 'userRegInfo', 'profile'), {
            firstName: firstname.value,
            lastName: lastname.value,
            email: email.value,
            phoneNumber: phone.value,
            createdAt: new Date()
        });

        // Create accounts subCollection: regular and savings
        const accountsRef = collection(DB, 'users', user.uid, 'accounts');
        const regularAccNum = regularAccountNumber;
        const savingsAccNum = savingsAccountNumber;

        // Create accounts type
        await Promise.all([
            setDoc(doc(accountsRef, 'regular'), {
                type: 'regular',
                accountNumber: regularAccNum,
                balance: 50,
                createdAt: new Date()
            }),
            setDoc(doc(accountsRef, 'savings'), {
                accountNumber: savingsAccNum,
                type: 'savings',
                balance: 0,
                createdAt: new Date()
            })
        ]);

        // Create account index useful for account lookups (transfers etc...)
        await Promise.all([
            setDoc(doc(DB, 'accountsIndex', regularAccNum), {
                uid: user.uid,
                type: 'regular',
                createdAt: new Date()
            }),
            setDoc(doc(DB, 'accountsIndex', savingsAccNum), {
                uid: user.uid,
                type: 'savings',
                createdAt: new Date()
            })
        ]);

        await sendEmail(user);
        clearForm();

        if (window.innerWidth < 600) {
            setTimeout(() => {
                getElement('#loaderOverlay').style.display = 'flex';
            }, 1500);
            setTimeout(() => {
                window.location.href = "./../index.html?showLogin=1";
            }, 3500);
        } else {
            setTimeout(() => {
                getElement('#loaderOverlay').style.display = 'flex';
            }, 1500);
            setTimeout(() => {
                window.location.href = './auth/login.html';
            }, 5000);
        }
    } catch (err) {
        console.error("Signup error:", err);
        showToast("An error occurred. Please try again.");
    }
});


const clearForm = () => {
    firstname.value = '';
    lastname.value = '';
    email.value = '';
    phone.value = '';
    password.value = '';
    confirmPassword.value = '';
};

const sendEmail = async (user) => {
    try {
        await sendEmailVerification(user)
        showToast('Verification link sent to your email');
    } catch (err) {
        console.error('Error sending verification email: ', err);
        confPassText.textContent = 'Failed to send verification email. Please try again.';
        throw err;
    }
};
