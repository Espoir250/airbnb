import { Router, Request, Response } from "express";
import { sendEmail } from "../../config/email"; // 🔁 adjust path if needed

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    await sendEmail(
      process.env["ADMIN_EMAIL"]!,
      `New Contact Message from ${name}`,
      `
        <h3>New message from AirbnbOn contact form</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `
    );

    res.status(200).json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error("Contact email error:", err);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

export default router;