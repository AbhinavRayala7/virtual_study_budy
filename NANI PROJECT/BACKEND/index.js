const express= require('express');
const cors =require('cors');
 const path = require('path');
  const { Low }= require('lowdb');
const { JSONFile } =require('lowdb/node');
   const { nanoid }= require('nanoid');
const bodyParser =require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'../frontend')));     //serve frontend static files
//setup lowdb
   const file = path.join(__dirname,'db.json');
const adapter = new JSONFile(file);
 const db = new Low(adapter);
async function initDB(){
  await db.read();
  db.data = db.data || { users: [],connections: [],messages: [] };
  await db.write();
}
initDB();
//  these are API routes
app.post('/api/register',async (req,res) => {
  const { id, name, bio, profilepic, courses = [], interests = [], availability = [] } = req.body;
  await db.read();
  // if ID is provided,updat existing user
  if (id){
    const user = db.data.users.find(u => u.id === id);
   if (!user) return res.status(404).json({ error: 'User not found' });
// merge new data into existing user object
    Object.assign(user,{ name,bio,profilepic,courses,interests,availability });
    await db.write();
    return res.json(user);
  }
  // otherwise,create a new user
  const newUser ={
  id: nanoid(8),
    name,
    bio: bio || '',
  profilepic: profilepic || '',
     courses,
    interests,
  availability,
    createdAt: Date.now()
  };
  db.data.users.push(newUser);
  await db.write();
  res.json(newUser);
});
app.get('/api/users',async(req,res) =>{
  await db.read();
  const { course,interest,availability }= req.query;

  let results = db.data.users.slice();
  if (course){

  const q =course.toLowerCase();
    results = results.filter(u => u.courses.some(c =>c.toLowerCase().includes(q)));
  }
  if (interest){
   const q = interest.toLowerCase();
    results = results.filter(u =>u.interests.some(i=>i.toLowerCase().includes(q)));
  }
  if (availability){
  const slots = availability.split(',').map(s=>s.trim().toLowerCase());
    results = results.filter(u=>u.availability.some(a=>slots.includes(a.toLowerCase())));
  }
  // return simplified user profiles
  res.json(results.map(u =>({
  id: u.id,
  name: u.name,
    bio: u.bio,
  courses: u.courses,
    interests: u.interests,
  availability: u.availability
  })));
});
//create a conection between 2 users
app.post('/api/connect',async (req,res) =>{
  const { fromId,toId } = req.body;
  if (!fromId || !toId) return res.status(400).json({ error: 'fromId and toId required' });
    await db.read();
  const from = db.data.users.find(u=>u.id === fromId);
   const to = db.data.users.find(u =>u.id === toId);
  if (!from || !to) return res.status(404).json({ error: 'User not found' });
  // check if connection already exists
   const exists = db.data.connections.find(c =>(c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId));
  if (exists) return res.json({ ok: true,connection: exists });
          // create new connection
    const conn = { id: nanoid(8), from: fromId,to: toId,createdAt: Date.now() };
  db.data.connections.push(conn);
    await db.write();
  res.json({ ok: true,connection: conn });
});
      // send a message between users it can include a meeting link
app.post('/api/messages',async (req,res) => {
  const { fromId,toId,text,meetingLink } = req.body;

  if (!fromId || !toId ||(!text && !meetingLink)) return res.status(400).json({ error: 'Missing fields' });
  await db.read();

  const msg = { id: nanoid(10),fromId,toId,text: text || '',meetingLink: meetingLink || '',createdAt: Date.now()};
    db.data.messages.push(msg);
  await db.write();
  res.json(msg);
});
// recover messages exchanged between 2 userss
app.get('/api/messages',async (req,res) =>{
  const { a,b } = req.query;
  if(!a || !b) return res.status(400).json({ error:'a and b required' });
     await db.read();
  const msgs = db.data.messages.filter(m =>(m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a));
   res.json(msgs);


});

const PORT = process.env.PORT || 4000; //start the server
app.listen(PORT,() =>console.log(`Server running on http://localhost:${PORT}`));
