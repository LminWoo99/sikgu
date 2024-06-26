import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../../css/BuyInfo.css"; 
import api from "../api"

function BuyInfo() {
  const [buyInfo, setBuyInfo] = useState([]);
  const id = localStorage.getItem("id");
  const token = localStorage.getItem("bbs_access_token");

  useEffect(() => {
    if (id) {
      fetchBuyInfo(id);
    } else {
      alert("구매 내역이 없습니다.");
    }
  }, [id]);

  const fetchBuyInfo = async (id) => {
    try {
      const response =await api.get(`${process.env.REACT_APP_SERVER_URL}/plant-service/api/buyInfo/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBuyInfo(response.data);
      console.log(response);
    } catch (error) {
      console.error("Error fetching buy info:", error);
    }
  };
  const formatDate = (dateString) => {
    console.log(dateString);

    const year = dateString[0]
    const month = dateString[1]
    const day = dateString[2]
    const hours = dateString[3]
    const minutes = dateString[4]
    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
};
  return (
    <div className="buyinfo-container">
      <h2>구매 내역</h2>
      <div className="buyinfo-list">
        {buyInfo.map((item) => (
          <div key={item.id} className="buyinfo-item">
            <Link to={`/bbsdetail/${item.id}`} className="bbs-title">
              <div className="item-title">{item.title}</div>
              <div className="item-status">{item.status}</div>
              <div className="item-status">{item.createBy}</div>
              <div className="item-date">{formatDate(item.createdAt)}</div>
            </Link>
          </div>
        ))}
        {buyInfo.length === 0 && <p>구매 내역이 없습니다.</p>}
      </div>
    </div>
  );
}

export default BuyInfo;
