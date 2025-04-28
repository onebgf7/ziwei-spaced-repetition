import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import CardManager from './CardManager';

function App() {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [done, setDone] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [showManager, setShowManager] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [limitInput, setLimitInput] = useState('10');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const res = await axios.get('http://localhost:5000/api/cards');
    // 只取今日要學習的卡片數量
    setCards(res.data.slice(0, dailyLimit));
    setCurrent(0);
    setShowAnswer(false);
    setDone(res.data.length === 0 || res.data.slice(0, dailyLimit).length === 0);
  };

  const handleReview = async (correct) => {
    await axios.post('http://localhost:5000/api/review', {
      id: cards[current].id,
      correct
    });
    if (current + 1 < cards.length) {
      setCurrent(current + 1);
      setShowAnswer(false);
    } else {
      setDone(true);
      fetchCards();
    }
  };

  const handleAddCard = async () => {
    if (!newQ || !newA) return;
    await axios.post('http://localhost:5000/api/add_card', {
      question: newQ,
      answer: newA
    });
    setNewQ('');
    setNewA('');
    setAddMode(false);
    fetchCards();
  };

  return (
    <div className="App">
      <h1>紫微斗數 間隔記憶法學習</h1>
      <button style={{float:'right',marginTop:'-32px'}} onClick={()=>setShowManager(true)}>卡片管理</button>
      <div style={{marginBottom:'16px',textAlign:'center'}}>
        <label>今日學習卡片數：
          <input style={{width:'48px',marginLeft:'8px'}} type="number" min="1" max="100" value={limitInput} onChange={e=>setLimitInput(e.target.value)} />
        </label>
        <button style={{marginLeft:'8px'}} onClick={()=>{setDailyLimit(Number(limitInput)||1); fetchCards();}}>設定</button>
      </div>
      <div className="card-box">
        {done ? (
          <div>
            <p>今日複習完成！</p>
            <button onClick={fetchCards}>重新整理</button>
          </div>
        ) : cards.length > 0 ? (
          <div>
            <div className="question">{cards[current].question}</div>
            {showAnswer ? (
              <div className="answer">{cards[current].answer}</div>
            ) : (
              <button className="show-btn" onClick={() => setShowAnswer(true)}>顯示答案</button>
            )}
            {showAnswer && (
              <div className="review-btns">
                <button onClick={() => handleReview(true)}>記住了</button>
                <button onClick={() => handleReview(false)}>沒記住</button>
              </div>
            )}
          </div>
        ) : (
          <p>沒有需要複習的卡片</p>
        )}
      </div>

      <div className="add-section">
        {addMode ? (
          <div className="add-form">
            <input type="text" placeholder="題目..." value={newQ} onChange={e => setNewQ(e.target.value)} />
            <input type="text" placeholder="答案..." value={newA} onChange={e => setNewA(e.target.value)} />
            <button onClick={handleAddCard}>新增</button>
            <button onClick={() => setAddMode(false)}>取消</button>
          </div>
        ) : (
          <button onClick={() => setAddMode(true)}>新增卡片</button>
        )}
      </div>
    {showManager && <CardManager onClose={()=>setShowManager(false)} />}
    </div>
  );
}

export default App;
