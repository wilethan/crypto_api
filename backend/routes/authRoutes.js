const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt"); // Import du module bcrypt qui permet de hacher les mots de passe
const jwt = require("jsonwebtoken"); // Import du module jsonwebtoken   qui permet de générer des tokens JWT
const Joi = require("joi"); // Import du module Joi qui permet de valider les données entrantes dans les requêtes HTTP
const { sendEmail } = require("../utils/emailService");

if (process.env.JWT_REFRESH_SECRET === undefined)
  throw new Error("JWT_REFRESH_SECRET is not defined"); //

// Validation des données avec Joi
const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .regex(/[A-Z]/, "uppercase")
      .regex(/[a-z]/, "lowercase")
      .regex(/[0-9]/, "number")
      .regex(/[^a-zA-Z0-9]/, "special character")
      .required(),
  });
  return schema.validate(data);
};

// Endpoint : POST /register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Validation des données
  const { error } = validateRegister(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    // Vérification si l'utilisateur existe déjà
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email déjà utilisé." });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Génération du token de validation d'email
    const emailVerificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h", // expire dans 1 heure
    });

    // Envoi de l'email de validation
    const validationLink = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
    await sendEmail(
      email,
      "Validation de votre email",
      `Cliquez sur ce lien pour valider votre email : ${validationLink}`,
      `<p>Cliquez sur ce lien pour valider votre email : <a href="${validationLink}">${validationLink}</a></p>`
    );

    // Création de l'utilisateur (avec token pour validation)
    const result = await pool.query(
      "INSERT INTO users (name, email, pswd, email_verification_token) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
      [name, email, hashedPassword, emailVerificationToken]
    );

    res.status(201).json({
      user: result.rows[0],
      message: "Un email de validation a été envoyé.",
    });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement :", err.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// Endpoint : POST /login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérification si l'utilisateur existe
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    if (!user)
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.pswd);
    if (!isMatch)
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });

    // Génération des tokens JWT
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // **Hachage du refresh token avant de le stocker**
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // Calcul de la date d'expiration (7 jours à partir de maintenant)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Ajouter le refreshToken et la date d'expiration à la base de données
    await pool.query(
      "INSERT INTO refresh_token (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [hashedRefreshToken, user.id, expiresAt]
    );

    // Stocker le refreshToken dans un cookie sécurisé
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// Endpoint : POST /verify-email
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;

  try {
    // Vérifier si le token est valide
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Mettre à jour le statut de l'utilisateur pour confirmer son email
    const result = await pool.query(
      "UPDATE users SET email_verified = TRUE WHERE email = $1 RETURNING id, email",
      [decoded.email]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Utilisateur non trouvé." });
    }

    res.status(200).json({ message: "Email vérifié avec succès." });
  } catch (err) {
    console.error("Erreur lors de la vérification du token :", err.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// Endpoint : POST /refresh
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // Récupération du refreshToken depuis les cookies
    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Token manquant, veuillez vous reconnecter." });
    }

    // Décoder le token sans le vérifier pour obtenir l'utilisateur
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      console.error("Erreur lors de la vérification du token :", err.message);
      return res
        .status(403)
        .json({ error: "Token invalide, veuillez vous reconnecter." });
    }

    // Vérifier si le token existe dans la base de données
    const tokenResult = await pool.query(
      "SELECT * FROM refresh_token WHERE user_id = $1",
      [decoded.id]
    );
    const storedToken = tokenResult.rows[0];

    if (!storedToken) {
      return res
        .status(403)
        .json({ error: "Token invalide, veuillez vous reconnecter." });
    }

    // Comparer le token reçu avec celui stocké (haché) dans la base de données
    const isTokenValid = await bcrypt.compare(refreshToken, storedToken.token);
    if (!isTokenValid) {
      return res
        .status(403)
        .json({ error: "Token invalide, veuillez vous reconnecter." });
    }

    // Supprimer l'ancien refreshToken
    await pool.query("DELETE FROM refresh_token WHERE token = $1", [
      storedToken.token,
    ]);

    // Générer un nouveau refreshToken et accessToken
    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Hacher le nouveau refreshToken avant de le stocker
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    // Ajouter le nouveau refreshToken dans la base de données
    await pool.query(
      "INSERT INTO refresh_token (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [
        hashedNewRefreshToken,
        decoded.id,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ]
    );

    // Stocker le nouveau refreshToken dans les cookies
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    // Retourner le nouveau accessToken
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token :", error.message);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

// Endpoint : POST /logout
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ error: "Token manquant." });
    }

    // Supprimer le refreshToken de la base de données
    await pool.query("DELETE FROM refresh_token WHERE token = $1", [
      refreshToken,
    ]);

    // Supprimer le cookie contenant le refreshToken
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.status(200).json({ message: "Déconnexion réussie." });
  } catch (err) {
    console.error("Erreur lors de la déconnexion :", err.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

module.exports = router;
