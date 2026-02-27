import { Question, IQuestion } from "../models/Question.js";
import { ClientAck, IClientAck } from "../models/ClientAck.js";

export interface QuestionPayload {
  seq: number;
  text: string;
  options?: string[];
  correctAnswer?: string;
}

class QuizSessionService {
  private nextSeq = 1;

  async initialize(): Promise<void> {
    const lastQuestion = await Question.findOne().sort({ seq: -1 }).limit(1);
    if (lastQuestion) {
      this.nextSeq = lastQuestion.seq + 1;
    } else {
      this.nextSeq = 1;
    }
  }

  async addQuestion(text: string, options?: string[], correctAnswer?: string): Promise<IQuestion> {
    const question = await Question.create({
      seq: this.nextSeq,
      text,
      options,
      correctAnswer,
    });
    this.nextSeq++;
    return question;
  }

  async getQuestionBySeq(seq: number): Promise<IQuestion | null> {
    return Question.findOne({ seq });
  }

  async getAllQuestions(): Promise<IQuestion[]> {
    return Question.find().sort({ seq: 1 });
  }

  async getQuestionsAfterSeq(seq: number): Promise<IQuestion[]> {
    return Question.find({ seq: { $gt: seq } }).sort({ seq: 1 });
  }

  async recordAck(clientId: string, seq: number): Promise<void> {
    let clientAck = await ClientAck.findOne({ clientId });

    if (!clientAck) {
      clientAck = await ClientAck.create({
        clientId,
        ackedSeqs: [seq],
        lastSeq: seq,
      });
    } else {
      if (!clientAck.ackedSeqs.includes(seq)) {
        clientAck.ackedSeqs.push(seq);
        clientAck.ackedSeqs.sort((a, b) => a - b);
      }
      if (seq > clientAck.lastSeq) {
        clientAck.lastSeq = seq;
      }
      clientAck.updatedAt = new Date();
      await clientAck.save();
    }
  }

  async getClientAck(clientId: string): Promise<IClientAck | null> {
    return ClientAck.findOne({ clientId });
  }

  async getReconcileQuestions(clientId: string, lastSeq: number): Promise<IQuestion[]> {
    const clientAck = await ClientAck.findOne({ clientId });
    const ackedSet = new Set(clientAck?.ackedSeqs ?? []);

    const questions = await this.getQuestionsAfterSeq(lastSeq);
    return questions.filter((q) => !ackedSet.has(q.seq));
  }
}

export const quizSession = new QuizSessionService();
