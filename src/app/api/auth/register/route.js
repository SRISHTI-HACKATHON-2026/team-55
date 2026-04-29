import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase, User } from "../../../../lib/db/mongoose";

export async function POST(request) {
  try {
    const { name, email, password, role, phone, houseNumber, familySize, familyGenders } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Hash the password with bcrypt (salt rounds: 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Validate role — only allow 'user' or 'admin'
    const validRole = ["user", "admin"].includes(role) ? role : "user";

    // Build the user document
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim() || "",
      role: validRole,
      trustScore: 0,
    };

    // Only store household data for residents
    if (validRole === "user") {
      userData.houseNumber  = houseNumber?.trim() || "";
      userData.familySize   = parseInt(familySize) || 1;
      userData.familyGenders = {
        male:   parseInt(familyGenders?.male)   || 0,
        female: parseInt(familyGenders?.female) || 0,
        other:  parseInt(familyGenders?.other)  || 0,
      };
    }

    // Create and save the user to MongoDB Atlas
    const newUser = await User.create(userData);

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
