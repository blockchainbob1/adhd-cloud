import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create clinic settings
  const clinicSettings = await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "ADHD Clinic",
      email: "admin@adhdclinic.com.au",
      phone: "+61 2 1234 5678",
      address: "123 Medical Street",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
      initialConsultPrice: 50000, // $500 in cents
      followUpConsultPrice: 30000, // $300 in cents
      depositPercentage: 100,
    },
  });
  console.log("Created clinic settings:", clinicSettings.name);

  // Create admin user (Clinic Manager)
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@adhdclinic.com.au" },
    update: {},
    create: {
      email: "admin@adhdclinic.com.au",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Manager",
      role: UserRole.CLINIC_MANAGER,
      phone: "+61 400 000 001",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create doctor
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@adhdclinic.com.au" },
    update: {},
    create: {
      email: "doctor@adhdclinic.com.au",
      password: hashedPassword,
      firstName: "Sarah",
      lastName: "Smith",
      role: UserRole.DOCTOR,
      phone: "+61 400 000 002",
      doctorProfile: {
        create: {
          providerNumber: "1234567A",
          specialty: "ADHD Specialist",
          qualifications: "MBBS, FRANZCP",
          biography:
            "Dr. Sarah Smith is an experienced psychiatrist specializing in ADHD diagnosis and treatment for adults and adolescents.",
        },
      },
    },
  });
  console.log("Created doctor user:", doctor.email);

  // Create doctor availability (Mon-Fri, 9am-5pm)
  const daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday
  for (const day of daysOfWeek) {
    await prisma.availability.upsert({
      where: {
        id: `${doctor.id}-${day}`,
      },
      update: {},
      create: {
        id: `${doctor.id}-${day}`,
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      },
    });
  }
  console.log("Created doctor availability for weekdays");

  // Create reception staff
  const reception = await prisma.user.upsert({
    where: { email: "reception@adhdclinic.com.au" },
    update: {},
    create: {
      email: "reception@adhdclinic.com.au",
      password: hashedPassword,
      firstName: "Jane",
      lastName: "Doe",
      role: UserRole.RECEPTION,
      phone: "+61 400 000 003",
    },
  });
  console.log("Created reception user:", reception.email);

  // Create sample patient
  const patient = await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      email: "patient@example.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Patient",
      role: UserRole.PATIENT,
      phone: "+61 400 000 004",
      dateOfBirth: new Date("1990-05-15"),
      patientProfile: {
        create: {
          address: "456 Patient Street",
          suburb: "Melbourne",
          state: "VIC",
          postcode: "3000",
          emergencyContact: "Emergency Contact",
          emergencyPhone: "+61 400 000 005",
        },
      },
    },
  });
  console.log("Created patient user:", patient.email);

  console.log("\n=== Seed completed ===");
  console.log("\nTest accounts (password: password123):");
  console.log("- Admin: admin@adhdclinic.com.au");
  console.log("- Doctor: doctor@adhdclinic.com.au");
  console.log("- Reception: reception@adhdclinic.com.au");
  console.log("- Patient: patient@example.com");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
