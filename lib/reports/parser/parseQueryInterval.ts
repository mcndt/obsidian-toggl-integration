import moment from "moment";

import type { ISODate, Query } from "../ReportQuery";

import {
  InvalidTokenError,
  ISODateFormat,
  Keyword,
  Parser,
  QueryParseError,
  Token,
} from "./Parser";

export class QueryIntervalParser extends Parser {
  /**
   * Parses a from and to date from the given array of tokens and mutates the
   * query object passed to it.
   * @returns remaining tokens.
   */
  public parse(tokens: Token[], query: Query): Token[] {
    const _tokens = [...tokens];

    let _from: moment.Moment = null;
    let _to: moment.Moment = null;

    const pos = 0;

    switch (_tokens[pos]) {
      case Keyword.TODAY:
        _from = moment();
        _tokens.splice(0, 1);
        break;
      case Keyword.WEEK:
        _from = moment().startOf("isoWeek");
        _to = moment().endOf("isoWeek");
        _tokens.splice(0, 1);
        break;
      case Keyword.MONTH:
        _from = moment().startOf("month");
        _to = moment().endOf("month");
        _tokens.splice(0, 1);
        break;
      case Keyword.FROM:
        // FROM
        _from = moment(_tokens[pos + 1], ISODateFormat, true);
        if (!_from.isValid()) {
          throw new InvalidDateFormatError(Keyword.FROM, _tokens[pos + 1]);
        }
        // TO
        if (_tokens[pos + 2] != Keyword.TO) {
          throw new InvalidTokenError(_tokens[pos + 2], [Keyword.TO]);
        }
        _to =
          _tokens[pos + 3] === Keyword.TODAY
            ? moment()
            : moment(_tokens[pos + 3], ISODateFormat, true);
        if (!_to.isValid()) {
          throw new InvalidDateFormatError(Keyword.TO, _tokens[pos + 3]);
        }
        _tokens.splice(0, 4);
        break;
      case Keyword.PAST: {
        const accepted: Token[] = [Keyword.DAYS, Keyword.WEEKS, Keyword.MONTHS];
        if (typeof _tokens[pos + 1] != "number") {
          throw new InvalidTokenError(_tokens[pos + 1], ["decimal number"]);
        }
        if (!accepted.includes(_tokens[pos + 2])) {
          throw new InvalidTokenError(_tokens[pos + 2], accepted);
        }
        const span = _tokens[pos + 1] as number;
        const unit = _tokens[pos + 2];
        switch (unit) {
          case Keyword.DAYS:
            _to = moment();
            _from = moment().subtract(span - 1, "days"); // sub 1 to include current day
            break;
          case Keyword.WEEKS:
            _to = moment().endOf("isoWeek");
            _from = moment()
              .startOf("isoWeek")
              .subtract(span - 1, "weeks");
            break;
          case Keyword.MONTHS:
            _to = moment().endOf("month");
            _from = moment()
              .startOf("month")
              .subtract(span - 1, "months");
            break;
        }

        _tokens.splice(0, 3);
      }
    }

    if (_from && _to && _to.diff(_from) < 0) {
      throw new InvalidIntervalError();
    }

    if (
      (_from && _to && _to.diff(_from, "days") > 366) ||
      (_from && !_to && moment().diff(_from) > 366)
    ) {
      throw new IntervalTooLargeError();
    }

    let from: ISODate = null;
    let to: ISODate = null;

    if (_from != null) {
      from = _from.format("YYYY-MM-DD");
    }

    if (_to != null) {
      to = _to.format("YYYY-MM-DD");
    }

    if (from == null && to == null) {
      throw new NoTimeIntervalExpression();
    }

    query.from = from;
    query.to = to;

    return _tokens;
  }

  get _acceptedTokens(): Token[] {
    return [
      Keyword.TODAY,
      Keyword.WEEK,
      Keyword.MONTH,
      Keyword.FROM,
      Keyword.PAST,
    ];
  }
}

export class InvalidDateFormatError extends QueryParseError {
  constructor(keyword: Token, received: Token) {
    super(
      `Cannot convert to valid date: "${received}". Keyword "${keyword}" must be followed by a ISO-formatted date. Example use: "FROM 2021-01-01 TO 2021-01-31"`,
    );
  }
}

export class InvalidIntervalError extends QueryParseError {
  constructor() {
    super("The FROM date must be before or the same as the TO date.");
  }
}

export class IntervalTooLargeError extends QueryParseError {
  constructor() {
    super("Toggl only provides reports over time spans less than 1 year.");
  }
}

export class NoTimeIntervalExpression extends QueryParseError {
  constructor() {
    super(`Query must include a time interval expression. Available expressions: 
		"${Keyword.TODAY}", 
		"${Keyword.WEEK}", 
		"${Keyword.MONTH}", 
		"${Keyword.PAST} ... ${Keyword.DAYS}/${Keyword.WEEKS}/${Keyword.MONTHS}", 
		"${Keyword.FROM} ... ${Keyword.TO} ..."`);
  }
}
