import React, { useMemo } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { differenceInDays, format, subDays } from 'date-fns';
import { useJobStore } from '../lib/store';

export const AnalyticsView: React.FC = () => {
  const { jobs } = useJobStore();

  const analyticsData = useMemo(() => {
    // 1. Funnel & Overview Metrics
    // Exclude 'pipeline' (Yet to Apply)
    const trackedJobs = jobs.filter(j => j.statusId !== 'pipeline');
    const totalTracked = trackedJobs.length;

    // Jobs that reached at least the interview stage (assuming 'interview' and 'offered' are the stages that count)
    // Note: If they were rejected AFTER an interview, their status might just be 'rejected'. 
    // To be perfectly accurate we'd track status history, but for a simple calculation we'll count jobs currently in interview or offered.
    // If they were rejected, we can check if they had an interview subStatus, but let's keep it simple.
    const interviewJobs = trackedJobs.filter(j => ['interview', 'offered'].includes(j.statusId));
    const totalInterviews = interviewJobs.length;

    const offerJobs = trackedJobs.filter(j => j.statusId === 'offered');
    const totalOffers = offerJobs.length;

    const rejectedJobs = trackedJobs.filter(j => j.statusId === 'rejected');
    const totalRejected = rejectedJobs.length;

    const interviewRate = totalTracked > 0 ? Math.round((totalInterviews / totalTracked) * 100) : 0;
    const offerRate = totalInterviews > 0 ? Math.round((totalOffers / totalInterviews) * 100) : 0;
    const rejectionRate = totalTracked > 0 ? Math.round((totalRejected / totalTracked) * 100) : 0;

    // 2. Actionable Insights
    const followUpsNeeded = trackedJobs.filter(j => j.statusId === 'follow-up').length;
    const stagnantApplications = trackedJobs.filter(j => {
      if (j.statusId !== 'waiting') return false;
      const updated = new Date(j.updatedAt);
      return differenceInDays(new Date(), updated) > 14;
    }).length;

    // 3. Activity Calendar Data
    // Initialize a map of the last 365 days
    const activityMap = new Map<string, number>();
    for (let i = 365; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      activityMap.set(dateStr, 0);
    }

    // Populate activity
    trackedJobs.forEach(job => {
      // Use dateApplied if available, else fallback to createdAt
      const dateStr = job.dateApplied 
        ? format(new Date(job.dateApplied), 'yyyy-MM-dd') 
        : format(new Date(job.createdAt), 'yyyy-MM-dd');
      
      if (activityMap.has(dateStr)) {
        activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
      }
    });

    const calendarData = Array.from(activityMap.entries()).map(([date, count]) => {
      // Calculate a "level" for the github-style graph (0 to 4)
      let level = 0;
      if (count > 0 && count <= 2) level = 1;
      else if (count > 2 && count <= 4) level = 2;
      else if (count > 4 && count <= 6) level = 3;
      else if (count > 6) level = 4;

      return { date, count, level };
    });

    return {
      totalTracked,
      interviewRate,
      offerRate,
      rejectionRate,
      followUpsNeeded,
      stagnantApplications,
      calendarData
    };
  }, [jobs]);

  return (
    <div className="analytics-container">
      <h2 className="analytics-header">Analytics Dashboard</h2>

      <div className="analytics-grid">
        {/* Funnel & Overview */}
        <div className="analytics-card metric-card">
          <h3>Total Applications</h3>
          <div className="metric-value">{analyticsData.totalTracked}</div>
          <p className="metric-subtext">Tracked jobs (excluding "Yet to Apply")</p>
        </div>
        
        <div className="analytics-card metric-card">
          <h3>Interview Rate</h3>
          <div className="metric-value">{analyticsData.interviewRate}%</div>
          <p className="metric-subtext">Applications leading to an interview</p>
        </div>

        <div className="analytics-card metric-card">
          <h3>Offer Rate</h3>
          <div className="metric-value">{analyticsData.offerRate}%</div>
          <p className="metric-subtext">Interviews resulting in an offer</p>
        </div>

        <div className="analytics-card metric-card">
          <h3>Rejection Rate</h3>
          <div className="metric-value danger" style={{ color: '#f85149' }}>{analyticsData.rejectionRate}%</div>
          <p className="metric-subtext">Applications that were rejected</p>
        </div>

        {/* Actionable Insights */}
        <div className="analytics-card action-card">
          <h3>Follow Ups Needed</h3>
          <div className="metric-value warning">{analyticsData.followUpsNeeded}</div>
          <p className="metric-subtext">Jobs waiting for a follow-up</p>
        </div>

        <div className="analytics-card action-card">
          <h3>Stagnant Applications</h3>
          <div className="metric-value danger">{analyticsData.stagnantApplications}</div>
          <p className="metric-subtext">&gt; 14 days in "Waiting" without updates</p>
        </div>
      </div>

      <div className="analytics-card calendar-card">
        <h3>Application Activity</h3>
        <p className="metric-subtext" style={{ marginBottom: '1.5rem' }}>Your job application history over the past year.</p>
        <div className="calendar-wrapper">
          <ActivityCalendar 
            data={analyticsData.calendarData} 
            theme={{
              light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
              dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
            }}
            colorScheme="dark" // Assuming we are primarily using a dark theme based on the UI
            labels={{
              legend: {
                less: 'Less',
                more: 'More'
              },
              months: [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ],
              totalCount: '{{count}} applications in the last year',
            }}
          />
        </div>
      </div>
    </div>
  );
};
