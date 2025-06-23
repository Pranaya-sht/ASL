"use client";

import React,{useState} from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';


const FlashcardFeedback = ({ 
  flashcardId, 
  onFeedbackSubmitted 
}) => {
   
  const handleFeedback = async (liked) => {
     const token = localStorage.getItem("access_token");
    try {
         const res = await fetch(`http://127.0.0.1:8000/learn/api/flashcards/${flashcardId}/feedback`, {
                method: 'POST',
                "Content-Type": "application/json",
                headers: { Authorization: `Bearer ${token}` ,
            }, 
           
        body:JSON.stringify({ liked }),
    },
    );

    const data = await res.json();
      console.log(data)
      console.log({
        title: "Feedback submitted",
        description: `Thank you for your ${liked ? 'positive' : 'negative'} feedback!`,
      });
      onFeedbackSubmitted?.();
    } catch (error) {
      console.log({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleFeedback(true)}
        className="flex items-center gap-2"
      >
        <ThumbsUp className="h-4 w-4" />
        Like
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleFeedback(false)}
        className="flex items-center gap-2"
      >
        <ThumbsDown className="h-4 w-4" />
        Dislike
      </Button>
    </div>
  );
};

export default FlashcardFeedback;
