import { auth, database } from './firebaseConfig';
import { AuthError, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { DatabaseReference, ref, set, onDisconnect, onValue, query, orderByChild, DataSnapshot, remove } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import './style.css';
import { App } from './chess';

let uid: string;
let pref: DatabaseReference;
let uref: DatabaseReference;
let rref: DatabaseReference;
let isCanCreateRoom: boolean = true;

function createRoom(data: DataSnapshot) {
  console.log(data);
  isCanCreateRoom = !isCanCreateRoom;
  if(isCanCreateRoom) {
    console.log(`${uid}: Return once`);
    return;
  }
  
  if(uid === Object.keys(data)[1]) {
    rref = ref(database, `rooms/${uuidv4()}`)
    set(rref, data);
    console.log("Deleting...");
    remove(pref).then(() => console.log("delete succeed"));
  }
  console.log("line 39 snapshot order check");
}

onAuthStateChanged(auth, (user) => {
  console.log(user);
  if (user) {
    // logged in!
    uid = user.uid;
    pref = ref(database, 'players');
    uref = ref(database, `players/${uid}`);

    set(uref, {
      uid,
      time: Date.now()
    });

    const q = query(uref, orderByChild('time'));

    onValue(pref, (snapshot) => {
      console.log("players number change detected!")
      const data: DataSnapshot = snapshot.val();
      if(data && Object.keys(data).length === 2) {
        console.log("Generating room...");
        createRoom(data);
      }
    });

    onDisconnect(uref).remove();

  } else {
    // logged out.
  }
})

signInAnonymously(auth).catch((error: AuthError) => {
  const errorCode = error.code;
  const errorMessage = error.message;

  console.log(errorCode, errorMessage);
});