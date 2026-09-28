import type { FAQItem } from '@/features/home/model';
import type { FaqsApi } from '../faqs.api';

const MOCK_FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'ما هي المستندات المطلوبة لاستئجار سيارة؟',
    answer:
      'يلزم تقديم رخصة قيادة سارية، وهوية وطنية أو إقامة، بالإضافة إلى وسيلة دفع باسم المستأجر.',
  },
  {
    id: '2',
    question: 'هل يمكنني إلغاء الحجز؟',
    answer:
      'يمكنك الإلغاء مجانًا قبل موعد الاستلام بـ 24 ساعة.',
  },
  {
    id: '3',
    question: 'هل يشمل السعر التأمين؟',
    answer:
      'يشمل التأمين الأساسي مع إمكانية إضافة تأمين شامل.',
  },
  {
    id: '4',
    question: 'هل يمكن استلام السيارة من فرع وإعادتها لفرع آخر؟',
    answer:
      'نعم حسب توفر الخدمة داخل المدينة.',
  },
  {
    id: '5',
    question: 'ما هي وسائل الدفع؟',
    answer:
      'بطاقات مدى، فيزا، ماستر كارد، والمحفظة الإلكترونية.',
  },
  {
    id: '6',
    question: 'هل يمكن تمديد مدة الإيجار؟',
    answer:
      'يمكن تمديد الإيجار إذا كانت السيارة متاحة.',
  },
  
];

// Read-only, so it is safe to run on the server.
export const faqsMock: FaqsApi = {
  async listFaqs() {
    return [...MOCK_FAQS];
  },
};
