import {useState, useEffect, useRef} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {SignifyClient, ready} from "signify-ts";
import { Signify } from './Signify';

import MainComponent from './MainComponent';

function generateRandomKey() {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 21;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function App() {

    useEffect(() => {
        ready().then(() => {
            console.log("signify client is ready")
        })
    }, [])



    return (
        <>
            <MainComponent/>
        </>
    )
}

export default App
