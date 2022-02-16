export class DuplicateMetricError extends Error {
  constructor (metricName) {
    super('duplicate metric')
    this.metricName = metricName
  }
}
