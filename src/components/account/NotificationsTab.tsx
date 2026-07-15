import type { AppNotification } from '@app-types/car';

interface Props {
  notifications: AppNotification[];
}

export default function NotificationsTab({ notifications }: Props) {
  return (
    <div className="account-panel">
      <div className="notifications_header">
        <h3>الإشعارات</h3>
        <button type="button" className="mark_read_btn">تحديد الكل كمقروء</button>
      </div>

      <div className="notifications_list">
        {notifications.map((n) => (
          <div key={n.id} className={`notifications_item ${n.read ? 'read' : ''}`}>
            <span className="notification_dot" />
            <div className="notification_body">
              <p>{n.title}</p>
              <span className="notification_time">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}