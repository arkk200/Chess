import { auth, db } from './firebaseConfig';
import { AuthError, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { DatabaseReference, ref, set, onDisconnect, onValue, DataSnapshot, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import './style.css';
import { App } from './chess';

interface objType {
  board: string,
  turn: string
};

const app = new App();
let uid: string;
let rref: DatabaseReference = ref(db, 'rooms');
let pref: DatabaseReference = ref(db, 'players');
let uref: DatabaseReference;
let isAlreadyJoin: boolean = false;

let ridref: DatabaseReference;
let savedChessNameMat: (string | undefined)[][] = [
  ["Black-Rook", "Black-Knight", "Black-Bishop", "Black-Queen", "Black-King", "Black-Bishop", "Black-Knight", "Black-Rook"],
  ["Black-Pawn", "Black-Pawn", "Black-Pawn", "Black-Pawn", "Black-Pawn", "Black-Pawn", "Black-Pawn", "Black-Pawn"],
  [],
  [],
  [],
  [],
  ["White-Pawn", "White-Pawn", "White-Pawn", "White-Pawn", "White-Pawn", "White-Pawn", "White-Pawn", "White-Pawn"],
  ["White-Rook", "White-Knight", "White-Bishop", "White-Queen", "White-King", "White-Bishop", "White-Knight", "White-Rook"]
];
function setSavedChessNameMat(mat: typeof savedChessNameMat) { // chess.ts폴더에서 수정할 수 있게 따로 함수를 만듦
  savedChessNameMat = mat;
}

const createRoom = async (data: DataSnapshot) => { // 방 만들기 및 체스 게임 생성
  
  app.chessNameMat = savedChessNameMat;
  app.playerColor = (data as any)[uid].color;

  await (async () =>  {
    if((data as any)[uid].isHost) {

      let rid = uuidv4();
      ridref = ref(db, `rooms/${rid}`);
      await set(ridref, { ...data, "board": JSON.stringify(savedChessNameMat), "turn": "W" });
      
      onValue(ridref, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if(data) {
          app.turn = data.turn;
        }
      });

    }
  })();
  app.setChess();
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // logged in!
    uid = user.uid;
    uref = ref(db, `players/${uid}`);
    
    await get(rref).then((snapshot: DataSnapshot) => {
      // 이미 방에 참가되어있는지 확인
      const data = snapshot.val();
      if(data) {
        const roomKeys = Object.keys(data);
        isAlreadyJoin = Object.values(data).some((roomObj, i) => {
          
          const isAlreadyJoin = Object.keys(roomObj as objType).some(key => key === uid);
          if(isAlreadyJoin) { // 만약 이미 방에 참가되어있다면
            
            ridref = ref(db, `rooms/${roomKeys[i]}`);
            app.chessNameMat = JSON.parse((roomObj as objType).board); // 하고 있었던 체스판 불러오기
            app.turn = (roomObj as objType).turn; // 하고 있던 체스턴 불러오기
            app.playerColor = (roomObj as any)[uid].color; // 내가 하고 있던 색 불러오기
          }
          return isAlreadyJoin;

        });
        
      }
    });

    if(isAlreadyJoin) {

      // 이미 참가하고 있다면
      app.setChess();

    } else {

      // 참가하지 않았다면 참가시키기
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

      onValue(pref, (snapshot: DataSnapshot) => { // 플레이어 데이터를 가져와 방 만들기
        const data: DataSnapshot = snapshot.val();
        if(data && Object.keys(data).length === 2) {
          createRoom(data);
        }
      });

      
    }
    onDisconnect(uref).remove();
  } else {
    // logged out.

  }
})

signInAnonymously(auth).catch((error: AuthError) => {
  const errorCode = error.code;
  const errorMessage = error.message;
  alert(`Error(${errorCode}): ${errorMessage}`);
});


export { ridref, savedChessNameMat, setSavedChessNameMat };