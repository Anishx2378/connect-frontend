const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email verification link to a newly registered user.
 */
const sendVerificationEmail = async (email, token, firstName) => {
  const verifyLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Coderaxo Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email – Coderaxo Connect",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Coderaxo Connect, ${firstName}!</h2>
        <p>Thank you for signing up. Please verify your email address to get started.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verifyLink}">${verifyLink}</a></p>
        <p style="color: #888; font-size: 12px; margin-top: 40px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    console.log("\n=============================================");
    console.log(`[DEV MODE] Verification Link: ${verifyLink}`);
    console.log("=============================================\n");
  }
};

/**
 * Send a workspace invite email.
 * Works for both new users and existing users.
 */
const sendInviteEmail = async (email, token, firstName, workspaceName, isExistingUser = false) => {
  const inviteLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/accept-invite?token=${token}`;

  const heading = isExistingUser
    ? `You've been invited to ${workspaceName}!`
    : `You've been invited to join Coderaxo Connect!`;

  const bodyText = isExistingUser
    ? `<p>You've been invited to join the <strong>${workspaceName}</strong> workspace on Coderaxo Connect.</p><p>Click the button below to accept the invitation.</p>`
    : `<p>An administrator from <strong>${workspaceName}</strong> has invited you to join their workspace on Coderaxo Connect.</p><p>Click the button below to create your account and join the team:</p>`;

  const buttonText = isExistingUser ? "Accept Invitation" : "Create Account & Join";

  const mailOptions = {
    from: `"Coderaxo Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: heading,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${heading}</h2>
        ${bodyText}
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${buttonText}</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invite email sent to ${email}`);
  } catch (error) {
    console.error("Error sending invite email:", error);
    console.log("\n=============================================");
    console.log(`[DEV MODE] Invite Link: ${inviteLink}`);
    console.log("=============================================\n");
  }
};

module.exports = { sendVerificationEmail, sendInviteEmail };
