import { app } from "./auth/Firebase/firebaseConfig.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth(app);


const getElement = (selector) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element with selector ${selector} not found`);
    return element;
};

const infosEl = getElement('#infos');
const loginRedirectLinkBtn = getElement('#loginRedirectLink');
const sideLoginForm = getElement('#side-login-form');
const sideLoginFormReturnBtn = getElement('.return-btn');
const categoriesInnerDiv = getElement('.categories-inner-div');
const loginRedirectionWrap = getElement('.loginRedirectionWrap');
const signupRedirectLinkWrap = getElement('.signupRedirectLinkWrap');
const signupBody = getElement('#signup-body');
const signupReturnBtn = getElement('.return-btn-wrap');
const landingPage = getElement('#main');
const ctaButtonAction = getElement('#ctaButtonAction');
const currentYear = getElement('#current-year');
const sideMenu = getElement('#side-menu');


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


// Loop cta Texts
const infoElTexts = [
    "Earn 5.2% APY on your savings—start today.",
    "FDIC-insured accounts. 24/7 fraud monitoring.",
    "Open an account in 3 minutes—no paperwork."
];

let textsIndex = 0;
let charIndex = 0;
let isDeleting = false;
// Function
const loopInfoTexts = () => {
    const currentText = infoElTexts[textsIndex];

    if (!isDeleting && charIndex < currentText.length) {
        infosEl.innerHTML = currentText.substring(0, charIndex) + '<span class="cursor">|</span>';
        charIndex++;
        setTimeout(loopInfoTexts, 100);

    } else if (isDeleting && charIndex > 0) {
        infosEl.innerHTML = currentText.substring(0, charIndex - 1) + '<span class="cursor">|</span>';
        charIndex--;
        setTimeout(loopInfoTexts, 50);

    } else {
        isDeleting = !isDeleting;
        if (!isDeleting) textsIndex = (textsIndex + 1) % infoElTexts.length;
        setTimeout(loopInfoTexts, isDeleting ? 1500 : 500);
    }
}
loopInfoTexts();

// redirect user to signup page from login
const redirectEnrollUser = () => {
    const params = new URLSearchParams(window.location.search);
    if (window.innerWidth > 600) {
        if (params.get('showSignUp') === '1') {
            const signupBody = getElement('#signup-body');
            if (signupBody) {
                signupBody.classList.add('active');
            } else {
                signupReturnBtn.addEventListener('click', () => {
                    params.delete('showSignUp');
                    signupBody.classList.remove('active');
                })
            }
        }
    }
}
redirectEnrollUser();

// Toggle login form
const toggleLoginForm = (e) => {
    e.preventDefault();
    if (window.innerWidth > 600) {
        const loaderOverlay = getElement('#loaderOverlay');
        
        setTimeout(() => {
            window.location.href = './auth/login.html';
        }, 2000);
    }
}
loginRedirectionWrap.addEventListener('click', toggleLoginForm)

// Close side-login-form when clicking outside (Large screens)
document.addEventListener('click', function (e) {
    if (
        sideLoginForm.classList.contains('slide-side-login-form') &&
        !e.target.closest('#side-login-form') &&
        !e.target.closest('#loginRedirectLink')
    ) {
        sideLoginForm.classList.remove('slide-side-login-form');
        document.body.classList.remove('no-scroll');
    }
});


// Toggle signup form
const toggleSignupForm = (e) => {
    e.preventDefault();
    signupBody.classList.toggle('active');

    if (signupBody.classList.contains('active')) {
        landingPage.style.transition = 'filter 1s cubic-bezier(.77,0,.18,1), background 1s cubic-bezier(.77,0,.18,1)';
        landingPage.style.filter = 'blur(6px) brightness(0.7)';
        document.body.classList.toggle('no-scroll');

        // Redirect to login page 
        const redirectPage = () => {
            const registeredLinkParent = getElement('.registered-link');
            const redirectionLink = registeredLinkParent.querySelector('a[href^="#"]');
            redirectionLink.addEventListener('click', (e) => {
                e.preventDefault();
                getElement('#loaderOverlay').style.display = 'flex';
                setTimeout(() => {
                    window.location.href = './auth/login.html';
                }, 1500);
            });
        }
        redirectPage();

    } else {
        landingPage.style.transition = 'filter 0.4s cubic-bezier(.77,0,.18,1), background 0.4s cubic-bezier(.77,0,.18,1)';
        landingPage.style.filter = '';
    }
}
// Open signup page with both buttons
[ctaButtonAction, signupRedirectLinkWrap].forEach(btn => {
    if (btn)
        btn.addEventListener('click', toggleSignupForm);
});
signupReturnBtn.addEventListener('click', toggleSignupForm);

// DOM for mobile devices
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('faded');
    
    if (window.innerWidth <= 600) {
        const menuIcon = loginRedirectLinkBtn.querySelector('.material-symbols-outlined');
        menuIcon.textContent = 'menu';
        // Check if the inner-texts is more than one 
        if (loginRedirectLinkBtn.childNodes.length > 1) {
            // If true, and also if it is a text node type update it
            if (loginRedirectLinkBtn.childNodes[1].nodeType === Node.TEXT_NODE) {
                loginRedirectLinkBtn.childNodes[1].textContent = ' Menu';
            }
            // Otherwise, insert a new text node.
        }

        // Toggle login form
        const toggleLoginForm = () => {

            // onAuthStateChanged(auth, (user) => {
            //     if (!user) {
            //         console.log('User is signed out');
            //     } else {
            //         console.log('User is active');
            //         console.log(user);
            //     }
            // });
            loginRedirectLinkBtn.addEventListener('click', () => {
                sideMenu.classList.toggle('active');
                if (sideMenu.classList.contains('active')) {
                    const listItems = sideMenu.querySelectorAll('ul > li');
                    const loginButton = listItems[0];
                    loginButton.addEventListener('click', () => {
                        setTimeout(() => {
                            sideLoginForm.classList.toggle('slide-side-login-form');
                            document.body.classList.toggle('no-scroll');
                        }, 10);
                        sideLoginFormReturnBtn.addEventListener('click', () => {
                            sideLoginForm.classList.remove('slide-side-login-form');
                            document.body.classList.remove('no-scroll');
                        })
                    });
                }
            });
        }
        toggleLoginForm();

        // Toggle signup form
        const toggleSignupForm = () => {
            const listItems = sideMenu.querySelectorAll('ul > li');
            const signupButton = listItems[1];
            signupButton.addEventListener('click', () => {
                setTimeout(() => {
                    signupBody.classList.toggle('active');
                    document.body.classList.toggle('no-scroll');    
                }, 10);
                signupReturnBtn.addEventListener('click', () => {
                    signupBody.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                })
            });
        }
        toggleSignupForm();

        // Redirect users to login page <600 screen sizes
        const redirectLoginPage = () => {
            // check if search params include 'showLogin=1:
            const params = new URLSearchParams(window.location.search);
            if (params.get('showLogin') === '1') {
                // check and compare, if exists toggle login form with classlist
                const sideLoginForm = getElement('#side-login-form');
                if (sideLoginForm) {
                    sideLoginForm.classList.add('slide-side-login-form');
                    document.body.classList.add('no-scroll');
                }
                sideLoginFormReturnBtn.addEventListener('click', () => {
                    sideLoginForm.classList.remove('slide-side-login-form');
                });
            }
        }
        redirectLoginPage();

        //  Redirect and/or login users to dashboard <600 screen sizes
        const redirectDashboard = async () => {
            const emailEl = getElement('#emailEl');
            const passwordEl = getElement('#passwordEl');
            try {
                const userCredential = await signInWithEmailAndPassword(auth, emailEl.value, passwordEl.value);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    showToast(`Your email address "${emailEl.value}" is not verified, please verify your email and try again.`);
                    emailEl.value = '';
                    passwordEl.value = '';
                    await auth.signOut();
                    return;
                }
                getElement('#loaderOverlay').style.display = 'flex';
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 4000);

            } catch (err) {
                if (err) {
                    const passWordIncorrectNotif = getElement('.password-incorrect');
                    passWordIncorrectNotif.style.display = 'flex'
                }
                console.error('Error logging in: ', err);
            }
        }
        getElement('#sideLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            redirectDashboard();
        });

        // Sliding carousel
        const slidingCarousel = () => {
        
            const ctaContainer = getElement('#cta')
            ctaContainer.innerHTML = '';
            const carouselTrack = document.createElement('div')
            carouselTrack.className = 'carousel-track'

            const messages = [
                'Earn 5.2% APY on your savings—start today.',
                'FDIC-insured accounts. 24/7 fraud monitoring.',
                'Open an account in 3 minutes—no paperwork.'
            ];

            messages.forEach(msg => {
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                slide.textContent = msg;
                carouselTrack.appendChild(slide)
            })

            ctaContainer.appendChild(carouselTrack);
            ctaContainer.classList.add('custom-carousel');

            carouselTrack.style.transform = 'translateX(0%)';

            ctaContainer.style.setProperty('background', 'linear-gradient(135deg, #005f73, #0a9396)', 'important');

            let index = 0;
            const slides = carouselTrack.children;

            setInterval(() => {
                index = (index + 1) % slides.length;
                carouselTrack.style.transform = `translateX(-${index * 100}%)`;
            }, 3000);
        }
        slidingCarousel();

    } else {
        loginRedirectLinkBtn.addEventListener('click', toggleLoginForm);
    }

    const lazyImages = [].slice.call(document.querySelectorAll('img[loading="lazy"]'));
    if ('IntersectionObserver' in window) {
        let lazyImageObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    lazyImage.classList.add('loaded');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });

        lazyImages.forEach(function (lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // CATEGORY DROPDOWN LOGIC
    let currentlyOpenDropdown = null;
    const categoryTriggers = document.querySelectorAll('#categories > div > a');
    const twoCategoryTriggers = categoryTriggers || categoriesInnerDiv;
    twoCategoryTriggers.forEach(trigger => {
        const dropdown = trigger.nextElementSibling;

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const expanded = trigger.getAttribute('aria-expanded') === 'true';

            // Close any open dropdown first
            if (currentlyOpenDropdown && currentlyOpenDropdown !== dropdown) {
                const prevTrigger = currentlyOpenDropdown.previousElementSibling;
                prevTrigger.setAttribute('aria-expanded', 'false');
                currentlyOpenDropdown.classList.remove('active');
            }

            // Toggle current dropdown
            trigger.setAttribute('aria-expanded', !expanded);
            dropdown.classList.toggle('active');

            // Update currently open dropdown
            currentlyOpenDropdown = !expanded ? dropdown : null;
        });
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#categories > div')) {
            categoryTriggers.forEach(trigger => {
                trigger.setAttribute('aria-expanded', 'false');
                trigger.nextElementSibling.classList.remove('active');
            });
            currentlyOpenDropdown = null;
        }
    });
    // Close dropdown with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentlyOpenDropdown) {
            const trigger = currentlyOpenDropdown.previousElementSibling;
            trigger.setAttribute('aria-expanded', 'false');
            currentlyOpenDropdown.classList.remove('active');
            currentlyOpenDropdown = null;
        }
    });
});

// Specify current year in footer
currentYear.textContent = new Date().getFullYear();

// Make sure this stays at the bottom to ensure all elements are loaded
getElement('#side-login-form');