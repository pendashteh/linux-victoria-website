
<script>
  // Define the event time in Melbourne
  const melbourneTimeZone = "Australia/Melbourne";
  const eventStart = new Date("2025-10-14T19:00:00+11:00"); // AEDT
  const eventEnd = new Date("2025-10-14T21:00:00+11:00");

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // If user's timezone is different, display local time
  if (userTimeZone !== melbourneTimeZone) {
    const options = { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    };

    const localStart = new Intl.DateTimeFormat([], { ...options, timeZone: userTimeZone }).format(eventStart);
    const localEnd = new Intl.DateTimeFormat([], { ...options, timeZone: userTimeZone }).format(eventEnd);

    const localTimeEl = document.createElement("p");
    localTimeEl.innerHTML = `<strong>${localStart} – ${localEnd} (${userTimeZone.replace("_", " ")})</strong>`;
    document.getElementById("event-time").appendChild(localTimeEl);
  }
</script>