const confetti =  new window.JSConfetti() 

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
// predection h1
const showPredection = document.getElementById('predection')
// Incremental Numbers
let number = 0
const incrementalNum = document.getElementById('increment-num')
incrementalNum.innerHTML = `${number}`

function calc_landmark_list(imgWidth,imgHeight,landmarks) {
  const landmarkArray =  landmarks.map((landmark) => {
    const landmark_X = Math.round(Math.min((landmark.x * imgWidth), imgWidth - 1))
    const landmark_Y = Math.round(Math.min((landmark.y * imgHeight), imgHeight - 1))
    return [landmark_X,landmark_Y]
  })

  return landmarkArray
}

function preProcessLandmark(landmarks) {
  let baseX = 0
  let baseY = 0

  const preProcessLandmark = landmarks.map((landmark,index) => {
    if(index == 0){
      baseX = landmark[0]
      baseY = landmark[1]
    }

    return [(landmark[0] - baseX),(landmark[1] - baseY)]
  })

  // Convert to a one-dimensional list
  const arr1d = [].concat(...preProcessLandmark);

  // absolute value array
  const absArray = arr1d.map(value => Math.abs(value))

  // max value
  const maxValue = Math.max(...absArray)

  // normalization
  const normalizedArray = arr1d.map((value) => value/maxValue)

  return normalizedArray
}




function onResults(results) {
  // Get Video Properties
  const videoWidth = videoElement.videoWidth
  const videoHeight = videoElement.videoHeight

  // Set video width and height
  canvasElement.width = videoWidth
  canvasElement.height = videoHeight
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,{color: '#FFFFFF', lineWidth: 0.5});
      // drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});
      // drawLandmarks(canvasCtx, landmarks, {color: '#FFFFFF', lineWidth: 2,
      //   radius: (data) => {
      //     return lerp(data.from.z, -0.15, .1, 10, 1);
      //   }
      // });
    }
    // console.log(results.multiHandLandmarks[0])
  }
  if (results.multiHandLandmarks.length > 0){
    // console.log("hello world")
    const landmarks = calc_landmark_list(videoWidth,videoHeight,results.multiHandLandmarks[0])

    const processedLandmarks = preProcessLandmark(landmarks)

    const data = tf.tensor2d([processedLandmarks])
    const predict = customModel.predict(data).dataSync()
    
    const gesture = Math.max(...predict)
    
    const gestureIndex = predict.indexOf(gesture)
    showPredection.innerHTML = `${gestureIndex}`
    if(gestureIndex === number && number < 10) {
      number += 1
      incrementalNum.innerHTML = `${number}`
    }
    if(gestureIndex === number && number === 10){
      confetti.addConfetti({
        confettiColors: [
          '#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7',
        ],
      })
      confetti.addConfetti({
        emojis: ['⚡️', '💥', '✨', '💫', '🌸'],
      })
      number = 0
      incrementalNum.innerHTML = `${number}`
    }
    // console.log(gestureIndex)
  }
  canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

let customModel = null

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    selfieMode: true,
});
hands.onResults(onResults);

async function loadModel(){
  // https://raw.githubusercontent.com/Narottam04/SignLanguage/master/frontend/model/asl_numbers_1-9/model.json
  // https://raw.githubusercontent.com/Narottam04/SignLanguage/master/frontend/model/asl_numbers_1-10/model.json 
  customModel = await tf.loadLayersModel("https://raw.githubusercontent.com/Narottam04/SignLanguage/master/frontend/model/asl_numbers_1-10/model.json")
}

loadModel()

const camera = new Camera(videoElement, {
onFrame: async () => {
  await hands.send({image: videoElement});
},
});
camera.start();
