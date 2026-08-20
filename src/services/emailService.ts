import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Táta má právo" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};

export const sendWelcomeEmail = (email: string, name: string) => {
  const html = `<h1>Vítejte v Táta má právo, ${name}!</h1><p>Děkujeme za registraci.</p>`;
  return sendEmail(email, 'Vítejte v Táta má právo', html);
};

export const sendPasswordResetEmail = (email: string, name: string, newPassword: string) => {
  const html = `<h1>Reset hesla</h1><p>Ahoj ${name}, tvoje nové heslo je: <strong>${newPassword}</strong></p>`;
  return sendEmail(email, 'Reset hesla - Táta má právo', html);
};

export const sendAccountDeletedEmail = (email: string, name: string) => {
  const html = `<h1>Účet byl smazán</h1><p>Ahoj ${name}, tvůj účet byl úspěšně smazán.</p>`;
  return sendEmail(email, 'Smazání účtu - Táta má právo', html);
};

export const sendQuickCreateEmail = (email: string, name: string, tempPassword: string) => {
  const html = `
    <h1>Váš účet na Táta má právo byl vytvořen</h1>
    <p>Ahoj ${name},</p>
    <p>Váš účet byl úspěšně vytvořen. Níže naleznete své přihlašovací údaje:</p>
    <ul>
      <li><strong>E-mail:</strong> ${email}</li>
      <li><strong>Heslo:</strong> ${tempPassword}</li>
    </ul>
    <p>Přihlásit se můžete na adrese: <a href="https://tatovacesta.cz/login">https://tatovacesta.cz/login</a></p>
    <p>Doporučujeme si heslo po prvním přihlášení změnit.</p>
  `;
  return sendEmail(email, 'Váš účet na Táta má právo byl vytvořen', html);
};

