// /src/modules/youtube/services/youtube-formatter.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class YouTubeFormatterService {
  /**
   * Format analytics data for visualization
   */
  formatAnalyticsData(data: any, timeUnit: string): any {
    if (!data || !data.rows || data.rows.length === 0) {
      return {
        labels: [],
        datasets: [],
        columnHeaders: data.columnHeaders || [],
        timeUnit,
      };
    }

    // Extract column headers (metrics names)
    const metrics = data.columnHeaders
      .filter((header) => header.type === 'METRIC')
      .map((header) => ({
        name: header.name,
        dataType: header.dataType,
        displayName: this.formatMetricName(header.name),
      }));

    // Extract dimension header
    const dimensionHeader = data.columnHeaders.find(
      (header) => header.type === 'DIMENSION',
    );

    // Extract labels (e.g., dates)
    const labels = data.rows.map((row) => row[0]);

    // Build datasets for each metric
    const datasets = metrics.map((metric, index) => {
      // Index in row is offset by 1 because the first item is the dimension
      const metricIndex = index + 1;

      return {
        label: metric.displayName,
        data: data.rows.map((row) => row[metricIndex]),
        fill: false,
        borderColor: this.getChartColor(index),
        tension: 0.1,
      };
    });

    return {
      labels,
      datasets,
      columnHeaders: data.columnHeaders,
      timeUnit,
    };
  }

  /**
   * Format demographics data for visualization
   */
  formatDemographicsData(data: any): any {
    if (!data || !data.rows || data.rows.length === 0) {
      return {
        ageGroups: {},
        genderDistribution: {},
      };
    }

    const ageGroups = {};
    const genderDistribution = {
      male: 0,
      female: 0,
      other: 0,
    };

    // Process the rows to structure the data
    data.rows.forEach((row) => {
      const ageGroup = row[0];
      const gender = row[1];
      const percentage = parseFloat(row[2]);

      // Process age group data
      if (!ageGroups[ageGroup]) {
        ageGroups[ageGroup] = {};
      }
      ageGroups[ageGroup][gender] = percentage;

      // Process gender distribution
      if (gender === 'male') {
        genderDistribution.male += percentage;
      } else if (gender === 'female') {
        genderDistribution.female += percentage;
      } else {
        genderDistribution.other += percentage;
      }
    });

    return {
      ageGroups,
      genderDistribution,
    };
  }

  /**
   * Merge analytics data with video details
   */
  mergeAnalyticsWithVideoDetails(analyticsData: any, videoDetails: any): any {
    const result = { ...analyticsData };

    if (analyticsData.rows && videoDetails.items) {
      // Create a mapping of video IDs to details
      const videoMap = {};
      videoDetails.items.forEach((item) => {
        videoMap[item.id] = item;
      });

      // Enhance rows with video details
      result.rows = analyticsData.rows.map((row) => {
        const videoId = row[0];
        const videoDetail = videoMap[videoId];

        if (videoDetail) {
          return {
            ...row,
            videoId,
            title: videoDetail.snippet?.title || 'Unknown',
            thumbnail: videoDetail.snippet?.thumbnails?.default?.url || '',
            publishedAt: videoDetail.snippet?.publishedAt,
            duration: videoDetail.contentDetails?.duration,
          };
        }

        return row;
      });
    }

    return result;
  }

  /**
   * Format metric name for display
   */
  private formatMetricName(name: string): string {
    // Map of metric names to display names
    const metricDisplayNames = {
      views: 'Views',
      likes: 'Likes',
      dislikes: 'Dislikes',
      comments: 'Comments',
      shares: 'Shares',
      subscribersGained: 'New Subscribers',
      subscribersLost: 'Lost Subscribers',
      estimatedMinutesWatched: 'Watch Time (minutes)',
      averageViewDuration: 'Avg. View Duration',
      annotationClickThroughRate: 'Annotation CTR',
      annotationCloseRate: 'Annotation Close Rate',
      audienceWatchRatio: 'Audience Watch Ratio',
      cardClickRate: 'Card Click Rate',
      cardTeaserClickRate: 'Card Teaser Click Rate',
    };

    return (
      metricDisplayNames[name] ||
      name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
    );
  }

  /**
   * Get color for chart based on index
   */
  private getChartColor(index: number): string {
    const colors = [
      '#FF6384', // Red
      '#36A2EB', // Blue
      '#FFCE56', // Yellow
      '#4BC0C0', // Teal
      '#9966FF', // Purple
      '#FF9F40', // Orange
      '#8AC55F', // Green
      '#F49AC2', // Pink
      '#7B9EA8', // Blue Gray
      '#6F8FAF', // Steel Blue
    ];

    return colors[index % colors.length];
  }
}
