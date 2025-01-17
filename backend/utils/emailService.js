const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Désactiver la vérification du certificat SSL
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email envoyé à ${to}`);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email :", err.message);
    throw new Error("Impossible d'envoyer l'email.");
  }
};

module.exports = { sendEmail };
