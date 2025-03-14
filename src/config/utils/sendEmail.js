const nodemailer = require("nodemailer");

const sendEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "adhijithu17@gmail.com",
        pass: "pwik wtxk qcwb ymie", // Generate from Google Account
      },
    });
    
    const sendEmail = async () => {
      try {
        const info = await transporter.sendMail({
          from: "adhijithu17@gmail.com",
          to: "arjunvayalar77@gmail.com",
          subject: "Hello from Gmail SMTP",
          text: "This is a test email!",
        });
    
        console.log("✅ Email sent:", info.messageId);
      } catch (error) {
        console.error("❌ Error:", error.message);
      }
    };

  } catch (err) {
    console.error(err.message);
  }
};

module.exports = sendEmail;
