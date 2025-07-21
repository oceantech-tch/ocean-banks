import { app } from "../Firebase/firebaseConfig.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth(app);

const getElement = (selector) => {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Element with selector ${selector} not found`);
    }
    return element;
}

const formEl = getElement('#login-form');
const emailEl = getElement('#emailEl');
const passwordEl = getElement('#passwordEl');
const hidePass = getElement('.hide-pass');


hidePass.addEventListener('click', (e) => {
    e.preventDefault();
    if (passwordEl.type === 'password') {
        passwordEl.type = 'text';
        hidePass.textContent = 'visibility';
    } else {
        passwordEl.type = 'password';
        hidePass.textContent = 'visibility_off';
    }
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log('User is signed out')
    } else {
        console.log('User is active!');
        console.log(user)
    }
});

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
});

const login = async () => {
    const emailValue = emailEl.value;
    const passwordValue = passwordEl.value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailValue, passwordValue);
        const user = userCredential.user;

        if (!user.emailVerified) {
            showToast(`Your email address "${emailValue}" is not verified, please verify your email and try again.`);
            clearForm();
            await auth.signOut();
            return;
        }
        const loaderOverlay = getElement('#loaderOverlay');
        loaderOverlay.style.display = 'flex';
        setTimeout(() => {
            window.location.href = `./../dashboard/index.html`;
        }, 4000);

    } catch (err) {
        console.error('Error logging in to your account: ', err);
    }
}

formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    login();
})

function clearForm() {
    emailEl.value = '';
    passwordEl.value = '';   
}

document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('faded');
});