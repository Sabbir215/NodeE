export default (brandName, name, otp, verificationLink) => {
  return `
  <div style="font-family: Arial, sans-serif; background: #f4f7fa; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">Welcome to ${brandName} 🎉</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; text-align: center; color: #333;">
        <h2 style="margin-bottom: 15px;">Hello ${name},</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">
          Thank you for registering! To complete your sign-up, please verify your email address.
        </p>

        <!-- OTP -->
        <div style="font-size: 20px; font-weight: bold; letter-spacing: 3px; color: #4f46e5; margin-bottom: 20px;">
          Your OTP: ${otp}
        </div>

        <!-- Button -->
        <a href="${verificationLink}" style="background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; display: inline-block;">
          Verify Email
        </a>
      </div>
      
      <!-- Footer -->
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        <p>If you did not sign up, you can ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
      </div>

    </div>
  </div>
  `;
};



// export default (brandName, name, otp, verificationLink) => {
//   return `
//   <div style="font-family: Arial, sans-serif; background: #f4f7fa; padding: 30px;">
//     <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
//       <!-- Header -->
//       <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
//         <h1 style="margin: 0;">Welcome to ${brandName} 🎉</h1>
//       </div>
      
//       <!-- Body -->
//       <div style="padding: 30px; text-align: center; color: #333;">
//         <h2 style="margin-bottom: 15px;">Hello ${name},</h2>
//         <p style="font-size: 16px; margin-bottom: 20px;">
//           Thank you for registering! To complete your sign-up, please verify your email address.
//         </p>

//         <!-- OTP -->
//         <div style="font-size: 20px; font-weight: bold; letter-spacing: 3px; color: #4f46e5; margin-bottom: 10px;">
//           Your OTP: ${otp}
//         </div>
//         <p style="font-size: 14px; color: #555; margin-bottom: 20px;">
//           *Note: This OTP expires in 15 minutes.*
//         </p>

//         <!-- Button -->
//         <a href="${verificationLink}" style="background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; display: inline-block; margin-bottom: 10px;">
//           Verify Email
//         </a>
//         <p style="font-size: 14px; color: #555;">
//           *Note: The verification link expires in 1 day.*
//         </p>
//       </div>
      
//       <!-- Footer -->
//       <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
//         <p>If you did not sign up, you can ignore this email.</p>
//         <p>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.</p>
//       </div>

//     </div>
//   </div>
//   `;
// };
