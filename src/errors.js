export class DuplicateMetricError extends Error {
  constructor (metricName) {
    super('duplicate metric')
    this.metricName = metricName
  }
}

export class InvalidMetricError extends Error {
  constructor (metricName) {
    super('invalid metric')
    this.metricName = metricName
  }
}
