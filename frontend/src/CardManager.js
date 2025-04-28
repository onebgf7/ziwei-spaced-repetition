import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CardManager.css';

function CardManager({ onClose }) {
  const [cards, setCards] = useState([]);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const res = await axios.get('http://localhost:5000/api/all_cards');
    setCards(res.data);
  };

  const handleAdd = async () => {
    if (!newQ || !newA) return;
    await axios.post('http://localhost:5000/api/add_card', { question: newQ, answer: newA });
    setNewQ('');
    setNewA('');
    fetchCards();
  };

  const handleDelete = async (idx) => {
    await axios.post('http://localhost:5000/api/delete_card', { id: idx });
    fetchCards();
  };

  return (
    <div className="card-manager-modal">
      <div className="card-manager-content">
        <h2>卡片管理</h2>
        <div className="add-form">
          <input type="text" placeholder="題目..." value={newQ} onChange={e => setNewQ(e.target.value)} />
          <input type="text" placeholder="答案..." value={newA} onChange={e => setNewA(e.target.value)} />
          <button onClick={handleAdd}>新增卡片</button>
        </div>
        <ul className="card-list">
          {cards.map((card, idx) => (
            <li key={idx}>
              <span className="q">Q: {card.question}</span>
              <span className="a">A: {card.answer}</span>
              <button className="delete-btn" onClick={() => handleDelete(idx)}>刪除</button>
            </li>
          ))}
        </ul>
        <button className="close-btn" onClick={onClose}>關閉</button>
      </div>
    </div>
  );
}

export default CardManager;
