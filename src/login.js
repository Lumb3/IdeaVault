const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function () {
  // Toggle password visibility
  const type =
    password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);

  this.classList.toggle("fa-eye-slash");
  this.classList.toggle("fa-eye");
});

const toggle_Lock = document.getElementById('toggleLock');
const passwordInput = document.getElementById('password');

function checkPassword() {
  const pass = passwordInput.value;

  if (pass === 'HUU') {     
    toggle_Lock.classList.add("fa-lock-open");     
    console.log("true");
    window.location.href = "index.html";
  } else {
    console.log("false");
  }
}
