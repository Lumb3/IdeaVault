const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
const toggle_Lock = document.getElementById("toggleLock");
const username = document.getElementById("username");
const alertBox = document.getElementById("alert");
const loginBtn = document.getElementById("loginBtn");
const signUp = document.getElementById("signupBtn");

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

document.addEventListener("keydown", (event) => {
  if (event.key == "Enter") {
    loginBtn.click(); // programmatically presses the loginBtn
  }
});

async function checkPasswordandUsername() {
  const response = await window.authAPI.login(username.value, password.value);
  alertBox.classList.remove("error", "success");
  if (response.success) {
    toggle_Lock.classList.add("fa-lock-open");
    alertBox.classList.add("success");
    alertBox.style.display = "block";
    alertBox.textContent = "Login Successful";
    setTimeout(() => {
      alertBox.style.display = "none";
      window.location.href = "index.html";
    }, 800);
    console.log("Password Matched. Success");
  } else {
    alertBox.classList.add("error");
    alertBox.style.display = "block";
    alertBox.textContent = "Incorrect username or password";
    console.log("Wrong Password. Error");
  }
}

signUp.addEventListener("click", function () {
  window.location.href = "signup.html";
});