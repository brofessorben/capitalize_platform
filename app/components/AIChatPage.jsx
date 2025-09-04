// inside onSend(), after: const data = await r.json();
const reply = data?.text || "Hmm, try that again?";
setMessages((m) => [...m, { role: "assistant", text: reply }]);

// NEW: accept smarter structured hints from the model
if (data?.leadHints && typeof data.leadHints === "object") {
  setLead((prev) => ({ ...prev, ...data.leadHints }));
} else {
  // keep your lightweight local extraction as a fallback
  extractToLead(reply, true);
}
