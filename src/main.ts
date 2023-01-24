/*




this file as firebase app.js

 */

import { auth, db } from './firebaseConfig';
import { AuthError, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { DatabaseReference, ref, set, onDisconnect, onValue, DataSnapshot, get, remove } from 'firebase/database';
import { App } from './chess';

interface objType {
  board: (string | 0)[][],
  turn: string
};

const app = new App();
let uid: string;
let rref: DatabaseReference = ref(db, 'rooms');
let pref: DatabaseReference = ref(db, 'players');
let uref: DatabaseReference;
let isAlreadyJoin: boolean = false;

let ridref: DatabaseReference;
const baseChessNameMat: (string | 0)[][] = [
  ["BR1", "BN1", "BB1", "BQ", "BK", "BB2", "BN2", "BR2"],
  ["BP1", "BP2", "BP3", "BP4", "BP5", "BP6", "BP7", "BP8"],
  new Array(8).fill(0),
  new Array(8).fill(0),
  new Array(8).fill(0),
  new Array(8).fill(0),
  ["WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7", "WP8"],
  ["WR1", "WN1", "WB1", "WQ", "WK", "WB2", "WN2", "WR2"]
];

function setupRidrefSnapshot(app: App) {
  onValue(ridref, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if(data) {
      if(data.winner !== "") {
        if(app.playerColor === data.winner) {
          alert("당신이 이겼습니다.");
        } else {
          alert("당신이 졌습니다.");
        }
        remove(ridref);
        window.location.reload();
        return;
      }
      app.turn = data.turn;
      app.chessMeshNameMat = JSON.parse(data.board);
      app.movChessPiece(JSON.parse(data.prevMov));
    }
  });
}

const createRoom = async (data: DataSnapshot) => { // 방 만들기 및 체스 게임 생성
  document.querySelector('.waiting-screen')?.classList.add('hide');
  document.querySelector('.game-screen')?.classList.remove('hide');

  app.chessMeshNameMat = baseChessNameMat;
  app.playerColor = (data as any)[uid].color;
  
  ridref = ref(db, `rooms/${Object.keys(data).join('')}`);
  
  // 호스트라면
  if((data as any)[uid].isHost) {
    await set(ridref, { ...data, board: JSON.stringify(baseChessNameMat), turn: "W", prevMov: 0, winner: "" });
  }
  setupRidrefSnapshot(app);
  app.setChess();
}


function joinGame(uid: string) {
  document.querySelector('.start-screen')?.classList.add('hide');
  document.querySelector('.waiting-screen')?.classList.remove('hide');

  if(isAlreadyJoin) {
    // 이미 참가하고 있다면
    document.querySelector('.waiting-screen')?.classList.add('hide');
    document.querySelector('.game-screen')?.classList.remove('hide');
    
    setupRidrefSnapshot(app);
    app.setChess();
  } else {

    get(pref).then((snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if(!data) {
        set(uref, {
          time: Date.now(),
          isHost: true,
          color: "W"
        });
      } else {
        set(uref, {
          time: Date.now(),
          isHost: false,
          color: "B"
        });
      }
    });

    // 참가하지 않았다면 참가시키기
    onValue(pref, (snapshot: DataSnapshot) => { // 플레이어 데이터를 가져와 방 만들기
      console.log("Who connected");
      const data: DataSnapshot = snapshot.val();
      if(data && Object.keys(data).length === 2 && Object.keys(data).includes(uid)) {
        createRoom(data);
        remove(pref);
      }
    });


  }
}


onAuthStateChanged(auth, async (user) => {
  if (user) {
    // logged in!
    uid = user.uid;
    uref = ref(db, `players/${uid}`);

    // 이미 방에 참가되어있는지 확인
    await get(rref).then((snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if(data) {
        const roomKeys = Object.keys(data);
        isAlreadyJoin = Object.values(data).some((roomObj, i) => {
          
          const isAlreadyJoin: boolean = Object.keys(roomObj as objType).some(key => key === uid);

          if(isAlreadyJoin) { // 만약 이미 방에 참가되어있다면
            
            ridref = ref(db, `rooms/${roomKeys[i]}`);
            app.chessMeshNameMat = JSON.parse((roomObj as any).board); // 하고 있었던 체스판 불러오기
            app.turn = (roomObj as objType).turn; // 하고 있던 체스턴 불러오기
            app.playerColor = (roomObj as any)[uid].color; // 내가 하고 있던 색 불러오기
            setupRidrefSnapshot(app);

          }
          return isAlreadyJoin;
        });
      }
    });

    const btn = document.createElement('button');
    btn.className = "start-btn";
    btn.innerText = isAlreadyJoin ? "재참가하기" : "시작하기";
    btn.addEventListener('click', () => joinGame(uid));

    document.querySelector('.start-screen')?.appendChild(btn);

    onDisconnect(uref).remove();

  } else {
    // logged out.

  }
});
signInAnonymously(auth).catch((error: AuthError) => {
  const errorCode = error.code;
  const errorMessage = error.message;
  alert(`Error(${errorCode}): ${errorMessage}`);
});


export { ridref };