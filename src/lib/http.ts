export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function fromZod(error: { issues: { message: string }[] }) {
  return jsonError(error.issues[0]?.message ?? "Invalid request", 400);
}
