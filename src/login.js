const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
const toggle_Lock = document.getElementById("toggleLock");
const username = document.getElementById("username");
const alertBox = document.getElementById("alert");
const loginBtn = document.getElementById("loginBtn");

togglePassword.addEventListener("click", function () {
  // Toggle password visibility
  const type =
    password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);

  this.classList.toggle("fa-eye-slash");
  this.classList.toggle("fa-eye");
});

// Will be encrypted through hashing
loginBtn.addEventListener("click", checkPasswordandUsername);
async function checkPasswordandUsername() {
  const response = await window.authAPI.login(username.value, password.value);

  if (response.success) {
    toggle_Lock.classList.add("fa-lock-open");
    alertBox.textContent = "Login Successful";
    alertBox.className = "success";
    setTimeout(() => {
      alertBox.style.display = "none";
      window.location.href = "index.html";
    }, 800);
    console.log("Password Matched. Success");
  } else {
    alertBox.textContent = "Incorrect username or password";
    alertBox.className = "error";
    alertBox.style.display = "block"; // Change the CSS property of the element
    console.log("Wrong Password. Error");
  }
}
