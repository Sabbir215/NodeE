export default (brandName, name, resetLink) => {
  return `
  <div style="font-family: Arial, sans-serif; background: #f4f7fa; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: #e11d48; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">${brandName} Password Reset 🔑</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; text-align: center; color: #333;">
        <h2 style="margin-bottom: 15px;">Hello ${name},</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">
          We received a request to reset your password. Click the button below to set a new one:
        </p>

        <!-- Button -->
        <a href="${resetLink}" style="background: #e11d48; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 16px; display: inline-block; margin-bottom: 20px;">
          Reset Password
        </a>

        <!-- Plain link fallback -->
        <p style="font-size: 14px; color: #555;">
          If the button doesn’t work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #555; word-break: break-all;">
          ${resetLink}
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>

    </div>
  </div>
  `;
};





// export default (brandName, username, resetLink) => {
//   return `
//   <!DOCTYPE html>
// <html>
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Reset Your Password</title>
//     <style>
//         body {
//             font-family: Arial, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//         }
//         .header {
//             text-align: center;
//             margin-bottom: 30px;
//         }
//         .content {
//             background: #f9f9f9;
//             padding: 20px;
//             border-radius: 5px;
//         }
//         .button {
//             display: inline-block;
//             padding: 10px 20px;
//             background-color: #007bff;
//             color: white;
//             text-decoration: none;
//             border-radius: 5px;
//             margin: 20px 0;
//         }
//         .footer {
//             margin-top: 30px;
//             font-size: 12px;
//             color: #666;
//             text-align: center;
//         }
//     </style>
// </head>
// <body>
//     <div class="header">
//         <h1>${brandName}</h1>
//     </div>
//     <div class="content">
//         <p>Hello ${username},</p>
//         <p>We received a request to reset your password. Click the button below to create a new password:</p>
//         <p style="text-align: center;">
//             <a href="${resetLink}" class="button">Reset Password</a>
//         </p>
//         <p>If you didn't request a password reset, you can ignore this email.</p>
//         <p>This link will expire in 24 hours.</p>
//         <p>For security reasons, please do not share this link with anyone.</p>
//     </div>
//     <div class="footer">
//         <p>This is an automated message from ${brandName}. Please do not reply to this email.</p>
//     </div>
// </body>
// </html>
//   `;
// };