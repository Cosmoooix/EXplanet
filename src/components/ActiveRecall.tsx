import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RecallDeck, Flashcard, Subject } from '../types/game';
import { sound } from '../utils/audio';
import {
  Brain,
  Plus,
  Upload,
  FileText,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface ActiveRecallProps {
  onBackToDashboard: () => void;
}

export const ActiveRecall: React.FC<ActiveRecallProps> = ({ onBackToDashboard }) => {
  const { activeRecallDecks, saveDeck, deleteDeck, recordCardReview } = useGame();

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // Review session state
  const [reviewCardIndex, setReviewCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [reviewSessionStats, setReviewSessionStats] = useState<{ correct: number; incorrect: number }>({
    correct: 0,
    incorrect: 0,
  });

  // Deck Studio state
  const [newDeckTitle, setNewDeckTitle] = useState<string>('');
  const [newDeckSubject, setNewDeckSubject] = useState<Subject>('Science');
  const [rawTextNotes, setRawTextNotes] = useState<string>('');
  const [extractedSentences, setExtractedSentences] = useState<string[]>([]);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [blankedWords, setBlankedWords] = useState<string[]>([]);
  const [cardPromptDraft, setCardPromptDraft] = useState<string>('');
  const [cardAnswerDraft, setCardAnswerDraft] = useState<string>('');
  const [stagedCards, setStagedCards] = useState<Flashcard[]>([]);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const activeDeck = activeRecallDecks.find(d => d.id === selectedDeckId);

  // File Upload Processor
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'txt') {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        setRawTextNotes(text);
        processRawText(text);
      };
      reader.readAsText(file);
    } else if (fileExt === 'docx' || fileExt === 'pdf') {
      // Read text content using FileReader text parsing
      const reader = new FileReader();
      reader.onload = ev => {
        const content = ev.target?.result as string;
        // Strip non-printable binary characters for readable preview
        const cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length < 20) {
          setFileUploadError(
            `Unable to extract plain text from "${file.name}". Try copying the text notes directly and pasting below.`
          );
        } else {
          setRawTextNotes(cleaned);
          processRawText(cleaned);
        }
      };
      reader.readAsText(file);
    } else {
      setFileUploadError('Supported file formats are .txt, .docx, or .pdf (text-based).');
    }
  };

  // Split raw text into clean, digestible sentences for Cloze flashcard generation
  const processRawText = (text: string) => {
    const rawSentences = text
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && s.length < 250);

    setExtractedSentences(rawSentences);
    if (rawSentences.length > 0) {
      selectSentenceForCloze(rawSentences[0], 0);
    }
  };

  const selectSentenceForCloze = (sentence: string, idx: number) => {
    setSelectedSentenceIndex(idx);
    setBlankedWords([]);
    setCardPromptDraft(sentence);
    setCardAnswerDraft('');
  };

  const toggleWordBlank = (word: string) => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim();
    if (!cleanWord) return;

    let updatedBlanked: string[];
    if (blankedWords.includes(cleanWord)) {
      updatedBlanked = blankedWords.filter(w => w !== cleanWord);
    } else {
      updatedBlanked = [...blankedWords, cleanWord];
    }
    setBlankedWords(updatedBlanked);

    if (selectedSentenceIndex !== null && extractedSentences[selectedSentenceIndex]) {
      const orig = extractedSentences[selectedSentenceIndex];
      let transformed = orig;
      updatedBlanked.forEach(target => {
        const regex = new RegExp(`\\b${target}\\b`, 'gi');
        transformed = transformed.replace(regex, '______');
      });
      setCardPromptDraft(transformed);
      setCardAnswerDraft(updatedBlanked.join(', '));
    }
  };

  const addStagedCard = () => {
    if (!cardPromptDraft.trim() || !cardAnswerDraft.trim()) return;

    const newCard: Flashcard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      front: cardPromptDraft.trim(),
      back: cardAnswerDraft.trim(),
      clozeWords: blankedWords,
      reviewedCount: 0,
      correctCount: 0,
    };

    setStagedCards(prev => [...prev, newCard]);
    sound.play('coin');

    // Move to next sentence if available
    if (
      selectedSentenceIndex !== null &&
      selectedSentenceIndex + 1 < extractedSentences.length
    ) {
      selectSentenceForCloze(
        extractedSentences[selectedSentenceIndex + 1],
        selectedSentenceIndex + 1
      );
    } else {
      setCardPromptDraft('');
      setCardAnswerDraft('');
      setBlankedWords([]);
    }
  };

  const handleSaveDeck = () => {
    if (!newDeckTitle.trim() || stagedCards.length === 0) return;

    const deck: RecallDeck = {
      id: `deck_${Date.now()}`,
      title: newDeckTitle.trim(),
      subject: newDeckSubject,
      description: `${stagedCards.length} student-crafted flashcards.`,
      sourceText: rawTextNotes,
      cards: stagedCards,
      createdAt: Date.now(),
    };

    saveDeck(deck);
    sound.play('levelUp');
    setIsCreatingDeck(false);
    setSelectedDeckId(deck.id);
  };

  const startReviewSession = (deckId: string) => {
    setSelectedDeckId(deckId);
    setReviewCardIndex(0);
    setIsAnswerRevealed(false);
    setReviewSessionStats({ correct: 0, incorrect: 0 });
    setIsReviewing(true);
    sound.play('click');
  };

  const handleReviewFeedback = (isCorrect: boolean) => {
    if (!activeDeck) return;
    const currentCard = activeDeck.cards[reviewCardIndex];
    recordCardReview(activeDeck.id, currentCard.id, isCorrect);

    setReviewSessionStats(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
    }));

    if (reviewCardIndex + 1 < activeDeck.cards.length) {
      setReviewCardIndex(prev => prev + 1);
      setIsAnswerRevealed(false);
    } else {
      // Completed deck review
      sound.play('victory');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl cosmic-card border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-cinzel">Active Recall Study Desk</h2>
            <p className="text-xs text-slate-400">
              Transform study guides into cloze flashcards and test long-term retention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCreatingDeck && !isReviewing && (
            <button
              onClick={() => {
                setIsCreatingDeck(true);
                setNewDeckTitle('');
                setRawTextNotes('');
                setExtractedSentences([]);
                setStagedCards([]);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Deck</span>
            </button>
          )}

          <button
            onClick={() => {
              if (isReviewing) setIsReviewing(false);
              else if (isCreatingDeck) setIsCreatingDeck(false);
              else onBackToDashboard();
            }}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            {isReviewing || isCreatingDeck ? 'Back to Decks' : 'Exit to Hub'}
          </button>
        </div>
      </div>

      {/* Review Mode View */}
      {isReviewing && activeDeck ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {reviewCardIndex < activeDeck.cards.length ? (
            <div className="cosmic-card rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8">
              {/* Progress Bar & Counter */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Deck: <strong className="text-white">{activeDeck.title}</strong>
                </span>
                <span>
                  Card {reviewCardIndex + 1} of {activeDeck.cards.length}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${((reviewCardIndex + 1) / activeDeck.cards.length) * 100}%`,
                  }}
                />
              </div>

              {/* The Flashcard */}
              <div className="min-h-56 p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e122b] border border-white/10 flex flex-col justify-center text-center space-y-4 shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Recall Prompt
                </span>
                <p className="text-lg sm:text-2xl font-medium text-white leading-relaxed">
                  {activeDeck.cards[reviewCardIndex].front}
                </p>

                {isAnswerRevealed && (
                  <div className="pt-6 border-t border-white/10 space-y-2 animate-fade-in">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Answer Key
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-300">
                      {activeDeck.cards[reviewCardIndex].back}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              {!isAnswerRevealed ? (
                <button
                  onClick={() => {
                    setIsAnswerRevealed(true);
                    sound.play('click');
                  }}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Reveal Answer</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleReviewFeedback(false)}
                    className="py-3 rounded-xl bg-rose-950/60 border border-rose-500/50 hover:bg-rose-900/60 text-rose-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Still Learning</span>
                  </button>

                  <button
                    onClick={() => handleReviewFeedback(true)}
                    className="py-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 hover:bg-emerald-900/60 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Remembered Correctly (+XP)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="cosmic-card rounded-3xl p-10 border border-white/10 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl">
                🎉
              </div>
              <h3 className="text-2xl font-bold text-white font-cinzel">Study Session Complete!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                You successfully reviewed all {activeDeck.cards.length} cards in this deck.
              </p>

              <div className="flex justify-center gap-8 text-center py-2">
                <div>
                  <p className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                    {reviewSessionStats.correct}
                  </p>
                  <p className="text-xs text-slate-400">Remembered</p>
                </div>
                <div>
                  <p className="text-2xl font-mono font-bold text-rose-400 tabular-nums">
                    {reviewSessionStats.incorrect}
                  </p>
                  <p className="text-xs text-slate-400">Needs Review</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => startReviewSession(activeDeck.id)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Review Again</span>
                </button>
                <button
                  onClick={() => setIsReviewing(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      ) : isCreatingDeck ? (
        /* Deck Studio View: Upload notes & Click-to-Blank Cloze Maker */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Notes & Settings */}
          <div className="lg:col-span-5 cosmic-card rounded-2xl p-6 border border-white/10 space-y-5">
            <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" />
              1. Import Study Material
            </h3>

            {/* Deck Title & Subject */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deck Title</label>
                <input
                  type="text"
                  placeholder="e.g., Chemistry Periodic Table & Bonds"
                  value={newDeckTitle}
                  onChange={e => setNewDeckTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Subject</label>
                <select
                  value={newDeckSubject}
                  onChange={e => setNewDeckSubject(e.target.value as Subject)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            {/* File Upload Option */}
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Upload Text File (.txt, .docx, .pdf)</label>
              <input
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-950 file:text-purple-300 hover:file:bg-purple-900 cursor-pointer"
              />
              {fileUploadError && (
                <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                  {fileUploadError}
                </p>
              )}
            </div>

            {/* Or Paste Text Notes */}
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Or Paste Study Notes Directly</label>
              <textarea
                rows={6}
                placeholder="Paste review material, textbook excerpts, or lecture notes here..."
                value={rawTextNotes}
                onChange={e => {
                  setRawTextNotes(e.target.value);
                  processRawText(e.target.value);
                }}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Right Column: Sentence Cloze Maker & Staged Cards */}
          <div className="lg:col-span-7 cosmic-card rounded-2xl p-6 border border-white/10 space-y-6">
            <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              2. Interactive Cloze Blanking Tool
            </h3>

            {extractedSentences.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select a sentence from your reviewer, then <strong>click words to hide them</strong> into fill-in-the-blank questions.
                </p>

                {/* Sentences Carousel / List */}
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-white/5">
                  {extractedSentences.map((sentence, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSentenceForCloze(sentence, idx)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors truncate ${
                        selectedSentenceIndex === idx
                          ? 'bg-purple-600 text-white font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {idx + 1}. {sentence}
                    </button>
                  ))}
                </div>

                {/* Word Picker for Cloze */}
                {selectedSentenceIndex !== null && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                    <p className="text-xs text-slate-400">Click words to toggle blanks:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedSentences[selectedSentenceIndex].split(/\s+/).map((word, wIdx) => {
                        const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim();
                        const isBlanked = blankedWords.includes(clean);
                        return (
                          <button
                            key={wIdx}
                            type="button"
                            onClick={() => toggleWordBlank(clean)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              isBlanked
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                            }`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Question & Answer Draft */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Generated Card Prompt</label>
                    <input
                      type="text"
                      value={cardPromptDraft}
                      onChange={e => setCardPromptDraft(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Expected Answer</label>
                    <input
                      type="text"
                      value={cardAnswerDraft}
                      onChange={e => setCardAnswerDraft(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-emerald-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addStagedCard}
                    disabled={!cardPromptDraft || !cardAnswerDraft}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Staged Deck ({stagedCards.length} created)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Upload a document or paste notes on the left to activate the Cloze tool.
              </div>
            )}

            {/* Staged Cards Summary & Final Save */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Staged Cards: <strong className="text-white">{stagedCards.length}</strong>
              </span>

              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={!newDeckTitle.trim() || stagedCards.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs disabled:opacity-40 shadow-lg shadow-emerald-500/20 transition-all"
              >
                Save Flashcard Deck
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Decks Overview Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-cinzel">Your Active Recall Library</h3>
            <span className="text-xs text-slate-400">{activeRecallDecks.length} Decks Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRecallDecks.map(deck => (
              <div
                key={deck.id}
                className="cosmic-card cosmic-card-hover rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-400 font-semibold">{deck.subject}</span>
                    <span className="text-slate-400">{deck.cards.length} cards</span>
                  </div>
                  <h4 className="text-base font-bold text-white leading-snug">{deck.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{deck.description}</p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => startReviewSession(deck.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Study Deck</span>
                  </button>

                  <button
                    onClick={() => deleteDeck(deck.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete Deck"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
