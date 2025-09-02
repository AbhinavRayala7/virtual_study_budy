const API = '/api';
async function searchUsers(){
  const course= document.getElementById('course').value;
  const interest= document.getElementById('interest').value;
  const query = new URLSearchParams({ course,interest });
   const res =await fetch(API +'/users?'+query.toString());
  const users = await res.json();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  if (users.length === 0){
    resultsDiv.innerHTML = '<p>No users found.</p>';
    return;
  }
  users.forEach(u=>{
    const div = document.createElement('div');
    div.innerHTML='<strong>'+u.name+'</strong><br>'+u.bio;
    resultsDiv.appendChild(div);
  });


}