export function calculateFare(farePerSeat: number, seats: number) {
  if (!Number.isInteger(farePerSeat) || farePerSeat < 1) {
    throw new Error("Invalid fare");
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
    throw new Error("Invalid seat count");
  }
  return farePerSeat * seats;
}

export function toPaise(rupees: number) {
  return rupees * 100;
}
