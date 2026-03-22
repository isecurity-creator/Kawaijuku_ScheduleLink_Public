function doPost(e) {
  try {
    const calendar = CalendarApp.getCalendarById("カレンダーIDをここに指定");
    const data = JSON.parse(e.postData.contents);
    const results = [];

    data.forEach(entry => {
      const { year, month, date, time, lesson, place } = entry;

      // 日付と時刻を整形
      const [startTimeStr, endTimeStr] = time.split("～");
      const startDateTime = new Date(`${year}-${pad(month)}-${pad(date)}T${startTimeStr}:00`);
      const endDateTime = new Date(`${year}-${pad(month)}-${pad(date)}T${endTimeStr}:00`);

      // 同一タイトル・時刻のイベントを削除（上書きのため）
      const existingEvents = calendar.getEvents(startDateTime, endDateTime, {
        search: lesson
      });

      for (let event of existingEvents) {
        if (event.getTitle() === lesson) {
          event.deleteEvent();
        }
      }

      // イベントを作成
      const newEvent = calendar.createEvent(lesson, startDateTime, endDateTime, {
        location: place
      });

      results.push({
        status: "created",
        title: lesson,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      });
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 補助関数：1桁の月日をゼロ埋めする
function pad(n) {
  return n.toString().padStart(2, '0');
}
