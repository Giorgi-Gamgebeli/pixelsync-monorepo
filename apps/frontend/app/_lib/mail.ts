import SMTPTransport from "nodemailer/lib/smtp-transport";
import nodemailer from "nodemailer";

export async function sendVerificationEmail(
  userName: string,
  email: string,
  token: string,
) {
  const confirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/new-verification?token=${token}`;

  const transport = nodemailer.createTransport({
    service: "gmail",
    secure: process.env.NODE_ENV !== "development",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  } as SMTPTransport.Options);

  await transport.sendMail({
    from: {
      name: "PixelSync",
      address: "no-reply@demomailtrap.co",
    },
    to: {
      name: userName,
      address: email,
    },
    subject: "PixelSync email verification",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #0891b2; 
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
    }
    .email-body {
      padding: 20px;
      font-size: 16px;
      line-height: 1.5;
      color: #333;
    }
    .button {
      display: block;
      margin: 0 auto;
      background-color: #06b6d4; 
      color: #ffffff !important;
      padding: 12px 20px;
      width: 200px;
      text-decoration: none;
      cursor: pointer;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Welcome to PixelSync</h1>
    </div>
    <div class="email-body">
      <p>Hi ${userName},</p>
      <p>Thank you for signing up with PixelSync. To complete your registration and verify your email address, please click the button below:</p>
      <a href="${confirmLink}" class="button">Verify Email Address</a>
      <p>If you did not sign up for this account, please ignore this email.</p>
      <p>Best regards, <br> The PixelSync Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 PixelSync. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  });
}

export async function sendResetPasswordEmail(
  userName: string,
  email: string,
  token: string,
) {
  const confirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/new-password?token=${token}`;

  const transport = nodemailer.createTransport({
    service: "gmail",
    secure: process.env.NODE_ENV !== "development",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  } as SMTPTransport.Options);

  await transport.sendMail({
    from: {
      name: "PixelSync",
      address: "no-reply@demomailtrap.co",
    },
    to: {
      name: userName,
      address: email,
    },
    subject: "PixelSync reset password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #0891b2;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
    }
    .email-body {
      padding: 20px;
      font-size: 16px;
      line-height: 1.5;
      color: #333;
    }
    .button {
      display: block;
      margin: 0 auto;
      background-color: #06b6d4;
      color: #ffffff !important;
      padding: 12px 20px;
      width: 200px;
      text-decoration: none;
      cursor: pointer;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="email-body">
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password for your PixelSync account. Click the button below to set a new password:</p>
      <a href="${confirmLink}" class="button">Reset Password</a>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <p>Best regards, <br /> The PixelSync Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 PixelSync. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  });
}
