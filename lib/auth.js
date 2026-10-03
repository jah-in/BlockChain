const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export function login(username, password) {
  if (
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    localStorage.setItem(
      "relieftrack-auth",
      JSON.stringify({
        authenticated: true,
        username: ADMIN_USERNAME,
        role: "Administrator",
      })
    );

    return true;
  }

  return false;
}

export function walletLogin(address) {
  if (typeof window === "undefined") {
    return false;
  }

  localStorage.setItem(
    "relieftrack-wallet-auth",
    JSON.stringify({
      authenticated: true,
      address,
      chainId: 31337,
      username: "Blockchain Admin",
      role: "Administrator",
      authenticatedAt: new Date().toISOString(),
    })
  );

  return true;
}

export function logout() {
  localStorage.removeItem("relieftrack-auth");
  localStorage.removeItem("relieftrack-wallet-auth");
}

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  // Check normal username/password authentication
  const normalAuth = localStorage.getItem("relieftrack-auth");

  if (normalAuth) {
    try {
      const user = JSON.parse(normalAuth);

      if (user.authenticated === true) {
        return true;
      }
    } catch {
      // Continue and check wallet authentication
    }
  }

  // Check MetaMask authentication
  const walletAuth = localStorage.getItem("relieftrack-wallet-auth");

  if (walletAuth) {
    try {
      const wallet = JSON.parse(walletAuth);

      if (wallet.authenticated === true) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  // Check normal username/password authentication
  const normalAuth = localStorage.getItem("relieftrack-auth");

  if (normalAuth) {
    try {
      const user = JSON.parse(normalAuth);

      if (user.authenticated === true) {
        return user;
      }
    } catch {
      // Continue and check wallet authentication
    }
  }

  // Check MetaMask authentication
  const walletAuth = localStorage.getItem("relieftrack-wallet-auth");

  if (walletAuth) {
    try {
      const wallet = JSON.parse(walletAuth);

      if (wallet.authenticated === true) {
        return wallet;
      }
    } catch {
      return null;
    }
  }

  return null;
}