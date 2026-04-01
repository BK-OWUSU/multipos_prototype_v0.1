import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendOTPEmail(email: string, name: string, otp: string): Promise<void> {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify Your MultiPOS Account",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #1A1A2E;">Welcome to MultiPOS!</h2>
                <p>Hi ${name},</p>
                <p>Please verify your email address using the OTP below:</p>
                <div style="
                background: #f5f5f5;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
                ">
                <h1 style="
                    font-size: 40px;
                    letter-spacing: 10px;
                    color: #1A1A2E;
                    margin: 0;
                ">${otp}</h1>
                </div>
                <p style="color: #666;">This OTP expires in <strong>10 minutes</strong>.</p>
                <p style="color: #666;">If you did not create a MultiPOS account, ignore this email.</p>
            </div>
              `
    })
}
