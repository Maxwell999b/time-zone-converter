"use server";

import { NextResponse } from "next/server";

export async function fetchTimeData(timezone: string) {
  try {
    const response = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`, { next: { revalidate: 60 } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching time data:", error);
    return NextResponse.json({ error: "Failed to fetch time data" }, { status: 500 });
  }
}
