import logger from './logger';
import AsapRequest from './asap_request';
import { InstanceDetails } from './autoscale_poller';

export interface StatsReporterOptions {
    retrieveUrl: string;
    reportUrl: string;
    instanceDetails: InstanceDetails;
    asapRequest: AsapRequest;
}

export interface StatsReport {
    instance: InstanceDetails;
    stats: unknown;
    shutdownStatus: boolean;
    timestamp: number;
}

export default class StatsReporter {
    private retrieveUrl: string;
    private reportUrl: string;
    private instanceDetails: InstanceDetails;
    private asapRequest: AsapRequest;
    private shutdownStatus: boolean;

    constructor(options: StatsReporterOptions) {
        this.retrieveUrl = options.retrieveUrl;
        this.reportUrl = options.reportUrl;
        this.instanceDetails = options.instanceDetails;
        this.asapRequest = options.asapRequest;

        this.shutdownStatus = false;

        this.retrieveStats = this.retrieveStats.bind(this);
        this.reportStats = this.reportStats.bind(this);
        this.setShutdownStatus = this.setShutdownStatus.bind(this);
        this.run = this.run.bind(this);
    }

    async run(): Promise<boolean> {
        logger.debug('Running stats collection');
        try {
            const stats = await this.retrieveStats();
            if (stats) {
                logger.debug('Stats collected', { stats });
                await this.reportStats(stats);
            }
            return true;
        } catch (err) {
            logger.error('Error in stats', { err });
        }
        return false;
    }

    setShutdownStatus(status: boolean): void {
        this.shutdownStatus = status;
    }

    async retrieveStats(): Promise<unknown> {
        const response = await this.asapRequest.getJson(this.retrieveUrl);
        if (response) {
            return response;
        }
    }

    async reportStats(stats: unknown): Promise<boolean> {
        const ts = new Date();
        const report = {
            instance: this.instanceDetails,
            stats,
            timestamp: ts.getTime(),
            shutdownStatus: this.shutdownStatus,
        };
        logger.debug('Stats report', { report });

        await this.asapRequest.postJson(this.reportUrl, report);
        return true;
    }
}
