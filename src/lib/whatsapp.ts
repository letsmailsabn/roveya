const note = "Hello ROVEYA, I would like to ask about a seat, a route, or a ride that is already moving.";

export function whatsAppLink(number: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(note)}`;
}
