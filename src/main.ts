import { auth, db } from './firebaseConfig';
import { AuthError, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { DatabaseReference, ref, set, onDisconnect, onValue, DataSnapshot, get, remove } from 'firebase/database';
import { App } from './chess';
import DomControls from './domControls';

interface objType {
  board: (string | 0)[][],
  turn: string
};

const domControls = new DomControls();
const chessBoard = new App();

let uid: string;
let rref: DatabaseReference = ref(db, 'rooms');
let pref: DatabaseReference = ref(db, 'players');
let uref: DatabaseReference;
let ridref: DatabaseReference;

let isAlreadyJoin: boolean = false;


function setupRidrefSnapshot(chessBoard: App) {
  onValue(ridref, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.winner !== "") {
        if (chessBoard.playerColor === data.winner) {
          alert("You win!");
        } else {
          alert("You lose.");
        }
        remove(ridref);
        window.location.reload();
        return;
      }
      chessBoard.turn = data.turn;
      chessBoard.piecesNameMat = JSON.parse(data.board);
      chessBoard.movChessPiece(JSON.parse(data.prevMov));
    }
  });
}

const createRoom = async (playerData: DataSnapshot) => {
  chessBoard.playerColor = (playerData as any)[uid].color;
  ridref = ref(db, `rooms/${Object.keys(playerData).join('')}`);

  
  if ((playerData as any)[uid].isHost) {
    await set(ridref, { ...playerData, board: JSON.stringify(chessBoard.piecesNameMat), turn: "W", prevMov: 0, winner: "" });
  }
  setupRidrefSnapshot(chessBoard);

  chessBoard.setChess();
  domControls.setupGameScreen(ridref, chessBoard.playerColor);
}


function joinRoom() {
  domControls.setupWaitingModal(uref);

  get(pref).then((snapshot: DataSnapshot) => {
    const someoneJoined = snapshot.val();
    if (!someoneJoined) {
      set(uref, {
        isHost: true,
        color: "W"
      });
    } else {
      set(uref, {
        isHost: false,
        color: "B"
      });
    }
  });

  // ???????????? ???????????? ???????????????
  onValue(pref, (snapshot: DataSnapshot) => { // ???????????? ???????????? ????????? ??? ?????????
    const playerData: DataSnapshot = snapshot.val();
    if (playerData && Object.keys(playerData).length === 2 && Object.keys(playerData).includes(uid)) {
      createRoom(playerData);
      remove(pref);
    }
  });
}


onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  domControls.setupMainScreen();

  uid = user.uid;
  uref = ref(db, `players/${uid}`);

  // ?????? ?????? ????????????????????? ??????
  await get(rref).then((snapshot: DataSnapshot) => {
    const roomsData = snapshot.val();
    if (roomsData) {
      const roomsKey = Object.keys(roomsData);
      isAlreadyJoin = Object.values(roomsData).some((roomObj, i) => {

        const isAlreadyJoin: boolean = Object.keys(roomObj as objType).some(playerUid => playerUid === uid);

        if (isAlreadyJoin) {
          ridref = ref(db, `rooms/${roomsKey[i]}`);
          chessBoard.piecesNameMat = JSON.parse((roomObj as any).board); // ?????? ????????? ????????? ????????????
          chessBoard.turn = (roomObj as objType).turn; // ?????? ?????? ????????? ????????????
          chessBoard.playerColor = (roomObj as any)[uid].color; // ?????? ?????? ?????? ??? ????????????
          return true;
        }
        return false;
      });
    }
  });

  if (isAlreadyJoin) {
    setupRidrefSnapshot(chessBoard);
    chessBoard.setChess();
    domControls.setupGameScreen(ridref, chessBoard.playerColor);
    return;
  }

  domControls.setupJoinButton(joinRoom);

  onDisconnect(uref).remove();
});

signInAnonymously(auth).catch((error: AuthError) => {
  const errorCode = error.code;
  const errorMessage = error.message;
  alert(`Error(${errorCode}): ${errorMessage}`);
});

export { ridref };