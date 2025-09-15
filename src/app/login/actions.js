"use server";
import { z } from 'zod';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const testUser = {
    id: "1",
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
};

// Define schema
const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export const contactAction = async (_prev, formData) => {
    const values = loginSchema.safeParse(Object.fromEntries(formData));
    if (!values.success) {
        return {
            errors: values.error.flatten().fieldErrors,
        };
    }

    const { email, password } = values.data;

    if (email !== testUser.email || password !== testUser.password) {
        console.log(typeof (email));
        console.log(typeof (password));
        return {
            errors: {
                email: ["Invalid email or password"],
            },
        };
    }

    await createSession(testUser.id);
    redirect("/admindashboard")
};

export async function logout() {
    await deleteSession();
    redirect("/login");
}