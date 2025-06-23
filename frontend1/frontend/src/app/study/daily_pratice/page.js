"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Play, RotateCcw } from 'lucide-react';
import FlashcardFeedback from '../flashcard_feedback/page';

const DailyPractice = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [completedCards, setCompletedCards] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [brokenVideoIds, setBrokenVideoIds] = useState(new Set());


  useEffect(() => {
    fetchDailyPractice();
  }, []);

  const fetchDailyPractice = async () => {
    const token = localStorage.getItem("access_token");
    try {
       const res = await fetch('http://127.0.0.1:8000/learn/api/daily-practice', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            console.log(data)
      setFlashcards(data);
   console.log(flashcards)
      
    } catch (error) {
      console.log({
        title: "Error",
        description: "Failed to load daily practice.",
        variant: "destructive",
      });
    } finally {
    const filteredFlashcards = flashcards.filter((cards)=>!brokenVideoIds.has(cards.id))
      setFlashcards(filteredFlashcards)
      console.log(filteredFlashcards)
      setLoading(false);
    }
  };

  const markAsCompleted = async (flashcardId) => {
    try {
      await apiService.completeDailyPractice({ flashcard_id: flashcardId });
      setCompletedCards(prev => new Set([...prev, flashcardId]));
      console.log({
        title: "Great job!",
        description: "Flashcard practice completed.",
      });
    } catch (error) {
      console.log({
        title: "Error",
        description: "Failed to mark practice as completed.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading daily practice...</div>;
  }

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No flashcards available for practice today.</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = completedCards.size;
  const totalCount = flashcards.length;
  const allCompleted = completedCount === totalCount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Practice</h2>
          <p className="text-muted-foreground">
            Progress: {completedCount}/{totalCount} completed
          </p>
        </div>
        {allCompleted && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">All done for today!</span>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {flashcards.map((flashcard) => {
          const isCompleted = completedCards.has(flashcard.id);
          
          return (
            <Card key={flashcard.id} className={isCompleted ? 'bg-green-50 border-green-200' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{flashcard.gloss}</CardTitle>
                    {flashcard.complexity && (
                      <CardDescription>Level {flashcard.complexity}</CardDescription>
                    )}
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {flashcard.video_url && (
                  <div className="aspect-video">
                   <ReactPlayer
                    url={flashcard.video_url}
                    controls
                    width="100%"
                    height="100%"
                    className="rounded-xl"
                    onError={() => {
                    console.warn(`Video failed to load: ${flashcard.video_url}`);
                    setBrokenVideoIds(prev => new Set(prev).add(flashcard.id));
                    }}
                    />

                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <FlashcardFeedback flashcardId={flashcard.id} />
                  
                  {!isCompleted ? (
                    <Button 
                      onClick={() => markAsCompleted(flashcard.id)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allCompleted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="text-center py-6">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Congratulations!
            </h3>
            <p className="text-green-700">
              You've completed all your daily practice for today. Great work!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyPractice;
