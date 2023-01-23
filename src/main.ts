import { auth, db } from './firebaseConfig';
import { AuthError, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { DatabaseReference, ref, set, onDisconnect, onValue, DataSnapshot, remove, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import './style.css';
import { App } from './chess';

let uid: string;
let rref = ref(db, 'rooms');
let pref: DatabaseReference = ref(db, 'players');;
let uref: DatabaseReference;
let isAlreadyJoin: boolean = false;

function createRoom(data: DataSnapshot) {
  console.log(data);
  
  const app = new App();
  console.log("app:", app);
  if(uid === Object.keys(data)[0]) {
    let rid = uuidv4();
    let ridref: DatabaseReference = ref(db, `rooms/${rid}`);
    set(ridref, {...data, "board": JSON.stringify(app.chessNameMat)});
    console.log("Deleting...");
    remove(pref).then(() => console.log("delete succeed"));
  }
  console.log("line 39 snapshot order check");
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // logged in!
    uid = user.uid;
    uref = ref(db, `players/${uid}`);
    
    await get(rref).then((snapshot: DataSnapshot) => {
      // 이미 방에 참가돼 있는지 확인
      const data = snapshot.val();
      try {
        isAlreadyJoin = Object.values(data).some(obj => {
          return Object.keys(obj as {}).some(key => key === uid)
        });
      } catch {
      }
    });

    if(!isAlreadyJoin) {
      // 참가하지 않았다면 참가시키기
      get(pref).then((snapshot: DataSnapshot) => {
        const data = snapshot.val();
        console.log("pref:" ,data);
        if(!data) {
          set(uref, {
            time: Date.now(),
            isHost: true
          });
        } else {
          set(uref, {
            time: Date.now(),
            isHost: false
          });
        }
      })
  
      onValue(pref, (snapshot: DataSnapshot) => {
        const data: DataSnapshot = snapshot.val();
        console.log("players number change detected!");
        if(data && Object.keys(data).length === 2) {
          console.log("Generating room...");
          createRoom(data);
        }
      });
  
      onDisconnect(uref).remove();
    } else {
      // 이미 참가하고 있다면
      const app = new App();
      console.log("app:", app);
    }
  } else {
    // logged out.

  }
})

signInAnonymously(auth).catch((error: AuthError) => {
  const errorCode = error.code;
  const errorMessage = error.message;

  console.log(errorCode, errorMessage);
});