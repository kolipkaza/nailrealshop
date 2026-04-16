// line-bot.js - LINE Messaging API Integration for NailReal Shop
const https = require('https');
const http = require('http');
const db = require('./db');

function getAccessToken() {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN;
}

// ============ Ollama LLM Integration ============
async function askLLM(userMessage, context) {
  const systemPrompt = [
    'คุณคือผู้ช่วยร้าน NailReal Shop ร้านทำเล็บ',
    'ตอบสั้น กระชับ เป็นกันเอง ใช้ภาษาไทย',
    'ถ้าลูกค้าถามเรื่องจองคิว แนะนำให้พิมพ์ จองคิว',
    'ถ้าลูกค้าถามเรื่องดูนัดหมาย แนะนำให้พิมพ์ ดูนัดหมาย',
    'ตอบไม่เกิน 3 ประโยค',
    context || ''
  ].join('\n');

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'gemma4:e4b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      think: false,
      options: { temperature: 0.7, num_predict: 500, num_ctx: 2048 }
    });

    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const content = (parsed.message && parsed.message.content) || '';
          const thinking = (parsed.message && parsed.message.thinking) || '';
          
          // Use content if available, otherwise extract from thinking
          let reply = content.trim();
          if (!reply && thinking.trim()) {
            // Take the last meaningful paragraph from thinking
            const lines = thinking.split('\n').filter((l) => l.trim().length > 0);
            reply = lines[lines.length - 1] || thinking.substring(0, 200);
          }
          
          console.log('[LLM] Reply:', (reply || 'EMPTY').substring(0, 80));
          resolve(reply || 'ขออภัย ตอบไม่ได้ตอนนี้ค่ะ พิมพ์ "เมนู" ดูตัวเลือกค่ะ');
        } catch (e) {
          console.log('[LLM] Parse error:', data.substring(0, 100));
          resolve('ขออภัย ระบบไม่พร้อมให้บริการตอนนี้ค่ะ');
        }
      });
    });
    req.on('error', () => resolve('ขออภัย ระบบไม่พร้อมให้บริการตอนนี้ค่ะ'));
    req.setTimeout(25000, () => { req.destroy(); resolve('ขออภัย ใช้เวลาตอบนานเกินไป กรุณาลองใหม่ค่ะ'); });
    req.write(body);
    req.end();
  });
}

// ============ LINE API Helpers ============

function lineRequest(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.line.me',
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getAccessToken(),
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error('LINE API ' + res.statusCode + ': ' + data));
        } else {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function replyMessage(replyToken, messages) {
  return lineRequest('/v2/bot/message/reply', { replyToken, messages });
}

function pushMessage(userId, messages) {
  return lineRequest('/v2/bot/message/push', { to: userId, messages });
}

// ============ User State Management ============
const userStates = {};

function getUserState(userId) {
  if (!userStates[userId]) {
    userStates[userId] = { step: 'idle', data: {} };
  }
  return userStates[userId];
}

function setUserState(userId, step, data) {
  userStates[userId] = { step, data: data || {} };
}

function clearUserState(userId) {
  userStates[userId] = { step: 'idle', data: {} };
}

// ============ Message Helpers ============

function textMessage(text) {
  return { type: 'text', text: text };
}

function confirmMessage(text) {
  return {
    type: 'template',
    altText: text,
    template: {
      type: 'confirm',
      text: text,
      actions: [
        { type: 'message', label: 'ใช่', text: 'ใช่' },
        { type: 'message', label: 'ไม่ใช่', text: 'ไม่ใช่' }
      ]
    }
  };
}

function carouselMessage(text, columns) {
  return {
    type: 'template',
    altText: text,
    template: { type: 'carousel', columns: columns }
  };
}

function quickReplyMessage(text, items) {
  return { type: 'text', text: text, quickReply: { items: items } };
}

// ============ Booking Flow ============

async function handleBooking(userId, messageText) {
  const state = getUserState(userId);

  switch (state.step) {
    case 'idle': {
      setUserState(userId, 'select_service', {});
      const services = await db.load('services');
      if (!services.length) {
        clearUserState(userId);
        return [textMessage('ขออภัย ตอนนี้ยังไม่มีบริการในระบบ กรุณาติดต่อร้านโดยตรงค่ะ')];
      }
      const columns = services.slice(0, 10).map((s) => ({
        title: s.name,
        text: '฿' + Number(s.price).toLocaleString() + ' | ' + (s.duration || '-') + ' นาที',
        actions: [{ type: 'message', label: 'เลือก', text: 'บริการ:' + s.id + ':' + s.name }]
      }));
      return [carouselMessage('💅 เลือกบริการที่ต้องการจอง', columns)];
    }

    case 'select_service': {
      if (messageText.startsWith('บริการ:')) {
        const parts = messageText.split(':');
        state.data.serviceId = parts[1];
        state.data.serviceName = parts.slice(2).join(':');
        setUserState(userId, 'select_date', state.data);
        return [textMessage('เลือก: ' + state.data.serviceName + '\n\nพิมพ์วันที่ต้องการจอง\nเช่น: 2026-04-20 หรือ 20/4/2569')];
      }
      return [textMessage('กรุณาเลือกบริการจากรายการด้านบนค่ะ')];
    }

    case 'select_date': {
      let dateStr = messageText.trim();
      const thaiMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (thaiMatch) {
        const day = thaiMatch[1].padStart(2, '0');
        const month = thaiMatch[2].padStart(2, '0');
        let year = parseInt(thaiMatch[3]);
        if (year > 2500) year -= 543;
        if (year < 100) year += 2000;
        dateStr = year + '-' + month + '-' + day;
      }
      const dateObj = new Date(dateStr + 'T00:00:00');
      if (isNaN(dateObj.getTime())) {
        return [textMessage('รูปแบบวันที่ไม่ถูกต้อง กรุณาลองใหม่\nเช่น: 2026-04-20 หรือ 20/4/2569')];
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        return [textMessage('ไม่สามารถจองวันในอดีตได้ กรุณาเลือกวันในอนาคตค่ะ')];
      }
      state.data.date = dateStr;
      setUserState(userId, 'select_time', state.data);
      const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
      const qrItems = timeSlots.map((t) => ({
        type: 'action',
        action: { type: 'message', label: t, text: 'เวลา:' + t }
      }));
      return [quickReplyMessage('วันที่: ' + dateStr + '\n\nเลือกเวลา', qrItems)];
    }

    case 'select_time': {
      if (messageText.startsWith('เวลา:')) {
        state.data.time = messageText.split(':')[1];
        setUserState(userId, 'input_name', state.data);
        return [textMessage('พิมพ์ชื่อ-นามสกุลของคุณ')];
      }
      return [textMessage('กรุณาเลือกเวลาจากรายการด้านบนค่ะ')];
    }

    case 'input_name': {
      state.data.customerName = messageText.trim();
      setUserState(userId, 'input_phone', state.data);
      return [textMessage('พิมพ์เบอร์โทรศัพท์ของคุณ\nเช่น: 0812345678')];
    }

    case 'input_phone': {
      const phone = messageText.trim().replace(/[\s\-]/g, '');
      if (!/^0[0-9]{8,9}$/.test(phone)) {
        return [textMessage('เบอร์โทรไม่ถูกต้อง กรุณาพิมพ์ใหม่\nเช่น: 0812345678')];
      }
      state.data.customerPhone = phone;
      setUserState(userId, 'confirm', state.data);
      const dateDisplay = new Date(state.data.date + 'T00:00:00').toLocaleDateString('th-TH', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      return [
        textMessage('ยืนยันการจอง\n\nบริการ: ' + state.data.serviceName + '\nวันที่: ' + dateDisplay + '\nเวลา: ' + state.data.time + ' น.\nชื่อ: ' + state.data.customerName + '\nเบอร์: ' + state.data.customerPhone + '\n\nยืนยันการจองใช่ไหม?'),
        confirmMessage('กดยืนยันหรือยกเลิก')
      ];
    }

    case 'confirm': {
      if (messageText === 'ใช่') {
        const appointments = await db.load('appointments');
        const maxNum = appointments.reduce((max, a) => {
          const match = a.id && a.id.match(/APP(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        const newId = 'APP' + String(maxNum + 1).padStart(3, '0');
        await db.add('appointments', {
          id: newId,
          customerName: state.data.customerName,
          customerPhone: state.data.customerPhone,
          serviceId: state.data.serviceId,
          serviceName: state.data.serviceName,
          date: state.data.date,
          time: state.data.time,
          source: 'line',
          lineUserId: userId,
          status: 'pending'
        });
        clearUserState(userId);
        return [textMessage('จองสำเร็จ!\n\nเลขที่นัดหมาย: ' + newId + '\n' + state.data.serviceName + '\n' + state.data.date + ' เวลา ' + state.data.time + ' น.\n\nร้านจะแจ้งยืนยันอีกครั้ง ขอบคุณค่ะ')];
      } else {
        clearUserState(userId);
        return [textMessage('ยกเลิกการจองแล้ว\nพิมพ์ "จองคิว" เมื่อต้องการจองใหม่ค่ะ')];
      }
    }

    default:
      clearUserState(userId);
      return [textMessage('เกิดข้อผิดพลาด กรุณาเริ่มใหม่\nพิมพ์ "จองคิว" เพื่อเริ่มจอง')];
  }
}

// ============ Check Appointment ============

async function handleCheckAppointment(userId) {
  const appointments = await db.load('appointments');
  const myAppts = appointments.filter((a) => a.lineUserId === userId);
  if (!myAppts.length) {
    return [textMessage('ไม่พบนัดหมายของคุณ\nหากต้องการจอง พิมพ์ "จองคิว" ได้เลยค่ะ')];
  }
  const activeAppts = myAppts.filter((a) => a.status !== 'cancelled').slice(0, 5);
  const statusLabel = { pending: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', 'in-progress': 'กำลังทำ', completed: 'เสร็จแล้ว', cancelled: 'ยกเลิก' };
  const msg = activeAppts.map((a) => {
    return a.id + ' — ' + a.serviceName + '\n' + a.date + ' ' + a.time + ' น. (' + (statusLabel[a.status] || a.status) + ')';
  }).join('\n\n');
  return [textMessage('นัดหมายของคุณ:\n\n' + msg)];
}

// ============ Cancel Appointment ============

async function handleCancelFlow(userId, messageText) {
  const state = getUserState(userId);

  if (state.step !== 'cancel_select' && state.step !== 'cancel_confirm') {
    // Show user's active appointments to cancel
    const appointments = await db.load('appointments');
    const myAppts = appointments.filter((a) =>
      a.lineUserId === userId && a.status !== 'completed' && a.status !== 'cancelled'
    );

    if (!myAppts.length) {
      return [textMessage('ไม่มีนัดหมายที่สามารถยกเลิกได้ค่ะ')];
    }

    const columns = myAppts.slice(0, 5).map((a) => ({
      title: a.serviceName,
      text: a.date + ' ' + a.time + ' น. (' + (a.status === 'pending' ? 'รอยืนยัน' : a.status) + ')',
      actions: [
        { type: 'message', label: 'ยกเลิกนัดนี้', text: 'ยกเลิก:' + a.id }
      ]
    }));

    setUserState(userId, 'cancel_select', {});
    return [carouselMessage('เลือกนัดหมายที่ต้องการยกเลิก', columns)];
  }

  if (state.step === 'cancel_select') {
    if (messageText.startsWith('ยกเลิก:')) {
      const apptId = messageText.split(':')[1];
      state.data.cancelId = apptId;
      setUserState(userId, 'cancel_confirm', state.data);
      return [
        textMessage('ยืนยันยกเลิกนัดหมาย ' + apptId + '?'),
        confirmMessage('กดยืนยันหรือยกเลิก')
      ];
    }
    clearUserState(userId);
    return [textMessage('ยกเลิกการดำเนินการแล้ว')];
  }

  if (state.step === 'cancel_confirm') {
    if (messageText === 'ใช่') {
      const apptId = state.data.cancelId;
      const appointments = await db.load('appointments');
      const appt = appointments.find((a) => a.id === apptId);
      if (appt) {
        appt.status = 'cancelled';
        await db.save('appointments', appointments);
      }
      clearUserState(userId);
      return [textMessage('ยกเลิกนัดหมาย ' + apptId + ' เรียบร้อยแล้วค่ะ\nหากต้องการจองใหม่ พิมพ์ "จองคิว" ได้เลย')];
    }
    clearUserState(userId);
    return [textMessage('ไม่ยกเลิกนัดหมายค่ะ')];
  }

  clearUserState(userId);
  return [textMessage('เกิดข้อผิดพลาด ลองใหม่อีกครั้งค่ะ')];
}

// ============ Push Notification Helper ============

async function sendLineNotification(lineUserId, message) {
  if (!lineUserId) return;
  try {
    await pushMessage(lineUserId, [textMessage(message)]);
    console.log('[LINE] Push sent to', lineUserId);
  } catch (err) {
    console.error('[LINE] Push failed:', err.message);
  }
}

// ============ Rich Menu Setup ============

async function setupRichMenu() {
  const token = getAccessToken();
  if (!token) return;

  // Check if rich menu already exists
  const checkReq = https.request({
    hostname: 'api.line.me',
    path: '/v2/bot/richmenu/list',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  }, (res) => {
    let data = '';
    res.on('data', (c) => { data += c; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.richmenus && result.richmenus.length > 0) {
          console.log('[LINE] Rich menu already exists:', result.richmenus[0].richMenuId);
          return;
        }
        createRichMenu(token);
      } catch (e) {
        console.log('[LINE] Rich menu check failed');
      }
    });
  });
  checkReq.on('error', () => {});
  checkReq.end();
}

function createRichMenu(token) {
  const menu = JSON.stringify({
    size: { width: 1200, height: 405 },
    selected: false,
    name: 'NailReal Menu',
    chatBarText: 'เมนู',
    areas: [
      { bounds: { x: 0, y: 0, width: 400, height: 405 }, action: { type: 'message', label: 'จองคิว', text: 'จองคิว' } },
      { bounds: { x: 400, y: 0, width: 400, height: 405 }, action: { type: 'message', label: 'ดูนัดหมาย', text: 'ดูนัดหมาย' } },
      { bounds: { x: 800, y: 0, width: 400, height: 405 }, action: { type: 'message', label: 'ยกเลิกนัด', text: 'ยกเลิกนัด' } }
    ]
  });

  const req = https.request({
    hostname: 'api.line.me',
    path: '/v2/bot/richmenu',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      'Content-Length': Buffer.byteLength(menu)
    }
  }, (res) => {
    let data = '';
    res.on('data', (c) => { data += c; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        console.log('[LINE] Rich menu created:', result.richMenuId);
        setDefaultRichMenu(token, result.richMenuId);
      } else {
        console.log('[LINE] Rich menu create failed:', data);
      }
    });
  });
  req.on('error', () => {});
  req.write(menu);
  req.end();
}

function setDefaultRichMenu(token, richMenuId) {
  const req = https.request({
    hostname: 'api.line.me',
    path: '/v2/bot/user/all/richmenu/' + richMenuId,
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  }, (res) => {
    let data = '';
    res.on('data', (c) => { data += c; });
    res.on('end', () => {
      console.log('[LINE] Default rich menu set:', res.statusCode);
    });
  });
  req.on('error', () => {});
  req.end();
}

// ============ Webhook Handler ============

const FAST_COMMANDS = ['จองคิว', 'จอง', 'book', 'ดูนัดหมาย', 'นัดหมาย', 'check', 'เมนู', 'menu', 'ช่วยเหลือ', 'ติดต่อร้าน', 'เกี่ยวกับ', 'ยกเลิกนัด', 'ยกเลิก'];

async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const messageText = event.message.text.trim();

    // Fast commands — reply directly
    if (FAST_COMMANDS.includes(messageText)) {
      if (messageText === 'จองคิว' || messageText === 'จอง' || messageText === 'book') {
        const msgs = await handleBooking(userId, messageText);
        return replyMessage(event.replyToken, msgs);
      }
      if (messageText === 'ดูนัดหมาย' || messageText === 'นัดหมาย' || messageText === 'check') {
        const msgs = await handleCheckAppointment(userId);
        return replyMessage(event.replyToken, msgs);
      }
      if (messageText === 'เมนู' || messageText === 'menu' || messageText === 'ช่วยเหลือ') {
        return replyMessage(event.replyToken, [textMessage('💅 NailReal Shop\n\nจองคิว — จองนัดทำเล็บ\nดูนัดหมาย — เช็คนัด\nติดต่อร้าน — ข้อมูลร้าน')]);
      }
      if (messageText === 'ติดต่อร้าน' || messageText === 'เกี่ยวกับ') {
        return replyMessage(event.replyToken, [textMessage('💅 NailReal Shop\nเปิด 10:00 - 19:00 น.\n\nพิมพ์ "จองคิว" เพื่อจองนัดได้เลยค่ะ')]);
      }
      if (messageText === 'ยกเลิกนัด' || messageText === 'ยกเลิก') {
        const msgs = await handleCancelFlow(userId, messageText);
        return replyMessage(event.replyToken, msgs);
      }
    }

    // Booking flow or cancel flow — reply directly
    const state = getUserState(userId);
    if (state.step !== 'idle' && state.step.startsWith('cancel_')) {
      const msgs = await handleCancelFlow(userId, messageText);
      return replyMessage(event.replyToken, msgs);
    }
    if (state.step !== 'idle') {
      const msgs = await handleBooking(userId, messageText);
      return replyMessage(event.replyToken, msgs);
    }

    // LLM — reply directly (no "กำลังคิด")
    try {
      const services = await db.load('services');
      const serviceList = services.map((s) => s.name + ' ฿' + s.price).join(', ');
      const llmReply = await askLLM(messageText, 'บริการที่มี: ' + serviceList);
      return replyMessage(event.replyToken, [textMessage(llmReply)]);
    } catch (err) {
      console.error('LLM error:', err.message);
      return replyMessage(event.replyToken, [textMessage('ขออภัย ระบบไม่พร้อมให้บริการตอนนี้ค่ะ พิมพ์ "เมนู" ดูตัวเลือก')]).catch(() => {});
    }
  }

  if (event.type === 'follow') {
    return replyMessage(event.replyToken, [
      textMessage('ยินดีต้อนรับสู่ NailReal Shop 💅✨\n\nพิมพ์ "จองคิว" เพื่อจองนัดทำเล็บ\nพิมพ์ "เมนู" ดูตัวเลือกทั้งหมด')
    ]);
  }

  return Promise.resolve(null);
}

module.exports = { handleEvent, sendLineNotification, setupRichMenu };
