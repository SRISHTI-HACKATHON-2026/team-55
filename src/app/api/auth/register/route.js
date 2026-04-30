import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase, Admin, Resident } from "../../../../lib/db/mongoose";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, phone, houseNumber, familySize, familyGenders, ngoId } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectToDatabase();

    // Validate role — default to resident
    const validRole = ["resident", "admin", "ngo"].includes(role) ? role : "resident";

    // Check if account already exists in either collection
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    const existingResident = await Resident.findOne({ email: email.toLowerCase() });
    const existingNgo = await Ngo.findOne({ email: email.toLowerCase() });
    
    if (existingAdmin || existingResident || existingNgo) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Hash the password with bcrypt (salt rounds: 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    let newUser;
    if (validRole === "admin") {
      newUser = await Admin.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
        department: "Municipal"
      });
    } else if (validRole === "ngo") {
      newUser = await Ngo.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        ngoId: ngoId?.trim() || `NGO-${Date.now()}`,
        role: "ngo",
        phone: phone?.trim() || "",
        category: "Food Recovery"
      });
    } else {
      newUser = await Resident.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim() || "",
        role: "resident",
        trustScore: 0,
        houseNumber: houseNumber?.trim() || "",
        familySize: parseInt(familySize) || 1,
        familyGenders: {
          male:   parseInt(familyGenders?.male)   || 0,
          female: parseInt(familyGenders?.female) || 0,
          other:  parseInt(familyGenders?.other)  || 0,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: validRole,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
